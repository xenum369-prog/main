import { NextResponse } from "next/server";
import { RequestStatus, Role } from "@prisma/client";
import { ApiError, currentUser, NO_LOCATION_ID, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { db } from "@/lib/prisma";
import { decisionSchema, uuidSchema } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Unauthenticated");
    requireRole(user, [Role.ADMIN, Role.MANAGER]);
    const { id } = await context.params;
    uuidSchema.parse(id);
    const input = decisionSchema.parse(await readJson(request));
    const result = await db.$transaction(async (tx) => {
      const record = await tx.maintenanceRequest.findFirst({
        where: { id, organizationId: user.organizationId, ...(user.role === Role.ADMIN ? {} : { locationId: user.locationId ?? NO_LOCATION_ID }) },
      });
      if (!record) throw new ApiError(404, "Request not found");
      if (record.status !== RequestStatus.SUBMITTED) throw new ApiError(409, "Request has already been reviewed");
      const changed = await tx.maintenanceRequest.update({
        where: { id },
        data: { status: input.status, decisionNote: input.decisionNote },
      });
      await audit(tx, user, `request.${input.status.toLowerCase()}`, "MaintenanceRequest", id, { note: input.decisionNote ?? "" });
      await tx.notification.create({
        data: { userId: record.requesterId, requestId: id, message: `Your request was ${input.status.toLowerCase()}.` },
      });
      return changed;
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ request: result });
  } catch (error) {
    return jsonError(error);
  }
}
