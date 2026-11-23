import { NextResponse } from "next/server";
import { RequestStatus, Role } from "@prisma/client";
import { ApiError, currentUser, NO_LOCATION_ID, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { assertSameOrigin, idempotencyKey, jsonError } from "@/lib/http";
import { idempotent } from "@/lib/idempotency";
import { uuidSchema } from "@/lib/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Unauthenticated");
    requireRole(user, [Role.ADMIN, Role.MANAGER]);
    const { id } = await context.params;
    uuidSchema.parse(id);
    const key = idempotencyKey(request);
    const result = await idempotent(user, `convert:${id}:${key}`, { requestId: id }, async (tx) => {
      const item = await tx.maintenanceRequest.findFirst({
        where: { id, organizationId: user.organizationId, ...(user.role === Role.ADMIN ? {} : { locationId: user.locationId ?? NO_LOCATION_ID }) },
      });
      if (!item) throw new ApiError(404, "Request not found");
      if (item.status !== RequestStatus.APPROVED) throw new ApiError(409, "Only approved requests can be converted");
      const order = await tx.workOrder.create({
        data: {
          organizationId: item.organizationId, locationId: item.locationId, requestId: item.id,
          assetId: item.assetId, title: item.title, description: item.description,
          checklist: [
            { label: "Visual inspection", done: false },
            { label: "Safety check", done: false },
            { label: "Record work performed", done: false },
          ],
        },
      });
      const updated = await tx.maintenanceRequest.update({ where: { id }, data: { status: "CONVERTED" } });
      await audit(tx, user, "request.converted", "MaintenanceRequest", id, { workOrderId: order.id });
      await audit(tx, user, "work-order.created", "WorkOrder", order.id, { requestId: id });
      if (order.assignedUserId) await tx.notification.create({
        data: { userId: order.assignedUserId, workOrderId: order.id, message: `You were assigned: ${order.title}` },
      });
      return { workOrder: order, request: updated };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
