import { NextResponse } from "next/server";
import { MovementType, Role } from "@prisma/client";
import { ApiError, currentUser, NO_LOCATION_ID } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { idempotent } from "@/lib/idempotency";
import { assertSameOrigin, idempotencyKey, jsonError, readJson } from "@/lib/http";
import { db } from "@/lib/prisma";
import { movementSchema, uuidSchema } from "@/lib/validation";
import { z } from "zod";

const reservationSchema = z.object({
  partId: z.string().uuid(),
  workOrderId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10000),
});

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (user.role === Role.REQUESTER) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const partId = new URL(request.url).searchParams.get("partId");
  if (partId && !uuidSchema.safeParse(partId).success) {
    return NextResponse.json({ error: "Invalid part identifier" }, { status: 400 });
  }
  const movements = await db.inventoryMovement.findMany({
    where: {
      ...(partId ? { partId } : {}),
      part: { organizationId: user.organizationId, ...(user.role === Role.ADMIN ? {} : { locationId: user.locationId ?? NO_LOCATION_ID }) },
    },
    include: { part: { select: { sku: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ movements });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Unauthenticated");
    const body = await readJson(request) as { action?: string };
    const key = idempotencyKey(request);
    if (body.action === "reserve" || body.action === "release") {
      const input = reservationSchema.parse(body);
      if (user.role !== Role.ADMIN && user.role !== Role.MANAGER && user.role !== Role.TECHNICIAN) {
        throw new ApiError(403, "Forbidden");
      }
      const result = await idempotent(user, `${body.action}:${key}`, { ...input, action: body.action }, async (tx) => {
        const order = await tx.workOrder.findFirst({
          where: { id: input.workOrderId, organizationId: user.organizationId, ...(user.role === Role.ADMIN ? {} : { locationId: user.locationId ?? NO_LOCATION_ID }), ...(user.role === Role.TECHNICIAN ? { assignedUserId: user.id } : {}) },
        });
        const part = await tx.part.findFirst({
          where: { id: input.partId, organizationId: user.organizationId, ...(user.role === Role.ADMIN ? {} : { locationId: user.locationId ?? NO_LOCATION_ID }) },
        });
        if (!order || !part) throw new ApiError(404, "Work order or part not found in your scope");
        const existing = await tx.reservation.findUnique({ where: { partId_workOrderId: { partId: part.id, workOrderId: order.id } } });
        if (body.action === "release") {
          if (!existing?.active || input.quantity > existing.quantity) throw new ApiError(409, "No matching active reservation to release");
          const remainder = existing.quantity - input.quantity;
          const reservation = await tx.reservation.update({
            where: { id: existing.id }, data: { quantity: remainder, active: remainder > 0 },
          });
          await tx.inventoryMovement.create({
            data: { partId: part.id, actorId: user.id, workOrderId: order.id, type: MovementType.RELEASE, quantity: input.quantity, reason: "Reservation released" },
          });
          await audit(tx, user, "inventory.released", "Reservation", reservation.id, { partId: part.id, quantity: input.quantity, workOrderId: order.id });
          return reservation;
        }
        if (existing?.active) throw new ApiError(409, "An active reservation already exists for this part and work order");
        const reserved = await tx.reservation.aggregate({ where: { partId: part.id, active: true }, _sum: { quantity: true } });
        const available = part.quantityOnHand - (reserved._sum.quantity ?? 0);
        if (available < input.quantity) throw new ApiError(409, "Insufficient available stock");
        const reservation = await tx.reservation.upsert({
          where: { partId_workOrderId: { partId: part.id, workOrderId: order.id } },
          create: { partId: part.id, workOrderId: order.id, quantity: input.quantity },
          update: { quantity: input.quantity, active: true, createdAt: new Date() },
        });
        await tx.inventoryMovement.create({
          data: { partId: part.id, actorId: user.id, workOrderId: order.id, type: MovementType.RESERVATION, quantity: input.quantity, reason: "Reserved for work order" },
        });
        await audit(tx, user, "inventory.reserved", "Reservation", reservation.id, { partId: part.id, quantity: input.quantity, workOrderId: order.id });
        return reservation;
      });
      return NextResponse.json({ reservation: result }, { status: 201 });
    }
    const input = movementSchema.parse(body);
    if (input.type === "RECEIPT" && user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
      throw new ApiError(403, "Only managers can receive stock");
    }
    const movement = await idempotent(user, `movement:${key}`, input, async (tx) => {
      const part = await tx.part.findFirst({
        where: { id: input.partId, organizationId: user.organizationId, ...(user.role === Role.ADMIN ? {} : { locationId: user.locationId ?? NO_LOCATION_ID }) },
      });
      if (!part) throw new ApiError(404, "Part not found");
      if (input.type === "ISSUE" && !input.workOrderId && user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
        throw new ApiError(403, "Technician issues must reference an assigned work order");
      }
      let reservation = null;
      if (input.workOrderId) {
        const order = await tx.workOrder.findFirst({
          where: { id: input.workOrderId, organizationId: user.organizationId, locationId: part.locationId, ...(user.role === Role.TECHNICIAN ? { assignedUserId: user.id } : {}) },
        });
        if (!order) throw new ApiError(404, "Work order not found in your scope");
        if (input.type === "ISSUE") {
          reservation = await tx.reservation.findUnique({ where: { partId_workOrderId: { partId: part.id, workOrderId: order.id } } });
          if (reservation?.active && reservation.quantity < input.quantity) throw new ApiError(409, "Issue exceeds reservation quantity");
        }
      }
      if (input.type === "ISSUE" && !reservation?.active) {
        const reserved = await tx.reservation.aggregate({ where: { partId: part.id, active: true }, _sum: { quantity: true } });
        if (part.quantityOnHand - (reserved._sum.quantity ?? 0) < input.quantity) throw new ApiError(409, "Insufficient available stock");
      }
      const delta = input.type === "RECEIPT" ? input.quantity : -input.quantity;
      const updated = await tx.part.update({
        where: { id: part.id },
        data: { quantityOnHand: { increment: delta } },
      });
      if (updated.quantityOnHand < 0) throw new ApiError(409, "Stock cannot become negative");
      if (reservation?.active) {
        const remainder = reservation.quantity - input.quantity;
        await tx.reservation.update({
          where: { id: reservation.id },
          data: { quantity: remainder, active: remainder > 0 },
        });
      }
      const created = await tx.inventoryMovement.create({
        data: {
          partId: part.id, actorId: user.id, workOrderId: input.workOrderId,
          type: input.type as MovementType, quantity: input.quantity, reason: input.reason,
        },
      });
      await audit(tx, user, `inventory.${input.type.toLowerCase()}`, "InventoryMovement", created.id, { partId: part.id, quantity: input.quantity, reason: input.reason });
      return created;
    });
    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
