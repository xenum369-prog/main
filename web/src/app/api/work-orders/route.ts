import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { ApiError, currentUser, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { idempotent } from "@/lib/idempotency";
import { assertSameOrigin, idempotencyKey, jsonError, readJson } from "@/lib/http";
import { db } from "@/lib/prisma";
import { scopedLocation } from "@/lib/permissions";
import { titleSchema } from "@/lib/validation";
import { z } from "zod";

const createSchema = z.object({
  title: titleSchema,
  description: z.string().trim().min(5).max(4000),
  assetId: z.string().uuid().nullable().optional(),
  assignedUserId: z.string().uuid().nullable().optional(),
  checklist: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
});

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const orders = await db.workOrder.findMany({
    where: {
      organizationId: user.organizationId,
      locationId: scopedLocation(user),
      ...(user.role === Role.TECHNICIAN ? { assignedUserId: user.id } : {}),
      ...(user.role === Role.REQUESTER ? { request: { requesterId: user.id } } : {}),
    },
    include: { asset: { select: { code: true, name: true } }, assignedUser: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ workOrders: orders });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Unauthenticated");
    requireRole(user, [Role.ADMIN, Role.MANAGER]);
    if (!user.locationId) throw new ApiError(403, "User has no assigned location");
    const input = createSchema.parse(await readJson(request));
    const key = idempotencyKey(request);
    const order = await idempotent(user, `work-order:${key}`, input, async (tx) => {
      if (input.assetId && !await tx.asset.findFirst({
        where: { id: input.assetId, organizationId: user.organizationId, locationId: user.locationId! },
      })) throw new ApiError(404, "Asset not found in your location");
      if (input.assignedUserId && !await tx.user.findFirst({
        where: { id: input.assignedUserId, organizationId: user.organizationId, locationId: user.locationId!, role: Role.TECHNICIAN, active: true },
      })) throw new ApiError(400, "Assignee must be an active technician at this location");
      const created = await tx.workOrder.create({
        data: {
          organizationId: user.organizationId, locationId: user.locationId!, title: input.title,
          description: input.description, assetId: input.assetId ?? null,
          assignedUserId: input.assignedUserId ?? null, checklist: input.checklist,
        },
      });
      await audit(tx, user, "work-order.created", "WorkOrder", created.id, {});
      return created;
    });
    return NextResponse.json({ workOrder: order }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
