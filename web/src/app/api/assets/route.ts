import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { currentUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { assertSameOrigin, idempotencyKey, jsonError, readJson } from "@/lib/http";
import { idempotent } from "@/lib/idempotency";
import { assetSchema } from "@/lib/validation";
import { scopedLocation } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { ApiError } from "@/lib/auth";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const assets = await db.asset.findMany({
    where: { organizationId: user.organizationId, locationId: scopedLocation(user) },
    include: { location: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Unauthenticated");
    requireRole(user, [Role.ADMIN, Role.MANAGER]);
    if (!user.locationId && user.role !== Role.ADMIN) throw new ApiError(403, "Location scope is required");
    const input = assetSchema.parse(await readJson(request));
    const key = idempotencyKey(request);
    const result = await idempotent(user, `asset:${key}`, input, async (tx) => {
      const locationId = user.locationId;
      if (!locationId) throw new ApiError(400, "Administrator must have a location to create assets");
      const asset = await tx.asset.create({
        data: { ...input, organizationId: user.organizationId, locationId },
      });
      await audit(tx, user, "asset.created", "Asset", asset.id, { code: asset.code });
      return asset;
    });
    return NextResponse.json({ asset: result }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
