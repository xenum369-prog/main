import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { ApiError, currentUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { assertSameOrigin, idempotencyKey, jsonError, readJson } from "@/lib/http";
import { idempotent } from "@/lib/idempotency";
import { requestSchema } from "@/lib/validation";
import { scopedLocation } from "@/lib/permissions";
import { audit } from "@/lib/audit";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const locationId = scopedLocation(user);
  const requests = await db.maintenanceRequest.findMany({
    where: {
      organizationId: user.organizationId,
      locationId,
      ...(user.role === Role.REQUESTER ? { requesterId: user.id } : {}),
    },
    include: {
      asset: { select: { name: true, code: true } },
      requester: { select: { name: true } },
      workOrder: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Unauthenticated");
    if (!user.locationId) throw new ApiError(403, "User has no assigned location");
    const input = requestSchema.parse(await readJson(request));
    const assetId = input.assetId ?? null;
    const key = idempotencyKey(request);
    const result = await idempotent(user, `request:${key}`, input, async (tx) => {
      if (assetId) {
        const asset = await tx.asset.findFirst({
          where: { id: assetId, organizationId: user.organizationId, locationId: user.locationId! },
        });
        if (!asset) throw new ApiError(404, "Asset not found in your location");
      }
      const created = await tx.maintenanceRequest.create({
        data: {
          ...input,
          assetId,
          organizationId: user.organizationId,
          locationId: user.locationId!,
          requesterId: user.id,
        },
      });
      const managers = await tx.user.findMany({
        where: {
          organizationId: user.organizationId,
          active: true,
          role: { in: [Role.ADMIN, Role.MANAGER] },
          OR: [{ locationId: user.locationId }, { role: Role.ADMIN }],
        },
        select: { id: true },
      });
      if (managers.length) await tx.notification.createMany({
        data: managers.map((manager) => ({ userId: manager.id, requestId: created.id, message: `New maintenance request: ${created.title}` })),
      });
      await audit(tx, user, "request.submitted", "MaintenanceRequest", created.id, { priority: created.priority });
      return created;
    });
    return NextResponse.json({ request: result }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
