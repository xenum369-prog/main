import { NextResponse } from "next/server";
import { MovementType, Role } from "@prisma/client";
import { ApiError, currentUser, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { idempotent } from "@/lib/idempotency";
import { assertSameOrigin, idempotencyKey, jsonError, readJson } from "@/lib/http";
import { db } from "@/lib/prisma";
import { scopedLocation } from "@/lib/permissions";
import { partSchema } from "@/lib/validation";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (user.role === Role.REQUESTER) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parts = await db.part.findMany({
    where: { organizationId: user.organizationId, locationId: scopedLocation(user) },
    include: {
      location: { select: { name: true } },
      reservations: { where: { active: true }, select: { quantity: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({
    parts: parts.map(({ reservations, ...part }) => {
      const reservedQuantity = reservations.reduce((total, reservation) => total + reservation.quantity, 0);
      return { ...part, reservedQuantity, availableQuantity: part.quantityOnHand - reservedQuantity };
    }),
  });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Unauthenticated");
    requireRole(user, [Role.ADMIN, Role.MANAGER]);
    if (!user.locationId) throw new ApiError(403, "User has no assigned location");
    const input = partSchema.parse(await readJson(request));
    const key = idempotencyKey(request);
    const part = await idempotent(user, `part:${key}`, input, async (tx) => {
      const created = await tx.part.create({
        data: {
          organizationId: user.organizationId, locationId: user.locationId!, sku: input.sku,
          name: input.name, quantityOnHand: input.openingQuantity, reorderPoint: input.reorderPoint,
        },
      });
      if (input.openingQuantity > 0) {
        await tx.inventoryMovement.create({
          data: { partId: created.id, actorId: user.id, type: MovementType.RECEIPT, quantity: input.openingQuantity, reason: "Opening balance" },
        });
      }
      await audit(tx, user, "inventory.part-created", "Part", created.id, { openingQuantity: input.openingQuantity });
      return created;
    });
    return NextResponse.json({ part }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
