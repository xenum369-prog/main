import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { ApiError, currentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { db } from "@/lib/prisma";
import { assignmentSchema, uuidSchema } from "@/lib/validation";
import { scopedLocation } from "@/lib/permissions";
import { isAllowedTransition } from "@/lib/work-order";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Unauthenticated");
    const { id } = await context.params;
    uuidSchema.parse(id);
    const input = assignmentSchema.parse(await readJson(request));
    const manager = user.role === Role.ADMIN || user.role === Role.MANAGER;
    if (!manager && user.role !== Role.TECHNICIAN) throw new ApiError(403, "Forbidden");
    if (!manager && (input.assignedUserId !== undefined || ["VERIFIED", "CLOSED"].includes(input.status ?? ""))) {
      throw new ApiError(403, "Only managers can assign, verify, or close work orders");
    }

    const updated = await db.$transaction(async (tx) => {
      const order = await tx.workOrder.findFirst({
        where: {
          id, organizationId: user.organizationId, locationId: scopedLocation(user),
          ...(user.role === Role.TECHNICIAN ? { assignedUserId: user.id } : {}),
        },
      });
      if (!order) throw new ApiError(404, "Work order not found");
      if (input.checklist && ["COMPLETED", "VERIFIED", "CLOSED"].includes(order.status)) {
        throw new ApiError(409, "Checklist is locked after work completion");
      }
      if (input.checklist) {
        const currentChecklist = Array.isArray(order.checklist)
          ? order.checklist as Array<{ label: string; done: boolean }>
          : [];
        if (input.checklist.length !== currentChecklist.length ||
            input.checklist.some((item, index) => item.label !== currentChecklist[index]?.label)) {
          throw new ApiError(409, "Checklist items cannot be added, removed, or renamed during work");
        }
        if (!manager && input.checklist.some((item, index) => currentChecklist[index]?.done && !item.done)) {
          throw new ApiError(409, "Completed checklist items cannot be unchecked");
        }
      }
      if (!manager && order.status === "COMPLETED" && input.status === "IN_PROGRESS") {
        throw new ApiError(403, "Only a manager can reopen a completed work order");
      }
      if (input.assignedUserId !== undefined && ["VERIFIED", "CLOSED"].includes(order.status)) {
        throw new ApiError(409, "Verified or closed work orders cannot be reassigned");
      }
      if (input.assignedUserId) {
        const assignee = await tx.user.findFirst({
          where: { id: input.assignedUserId, organizationId: user.organizationId, locationId: order.locationId, role: Role.TECHNICIAN, active: true },
        });
        if (!assignee) throw new ApiError(400, "Assignee must be an active technician at this location");
      }
      if (input.status && !isAllowedTransition(order.status, input.status)) {
        throw new ApiError(409, `Transition from ${order.status} to ${input.status} is not allowed`);
      }
      if (input.status === "COMPLETED" && !input.completionNote?.trim()) {
        throw new ApiError(400, "Completion note is required");
      }
      if (input.status === "COMPLETED" && Array.isArray(order.checklist)) {
        const checklist = order.checklist as Array<{ done?: boolean }>;
        if (checklist.some((item) => item.done !== true)) {
          throw new ApiError(409, "Complete every checklist item before completing this work order");
        }
      }
      const changed = await tx.workOrder.update({
        where: { id },
        data: {
          ...(input.assignedUserId !== undefined ? { assignedUserId: input.assignedUserId } : {}),
          ...(input.status ? { status: input.status } : {}),
          ...(input.completionNote !== undefined ? { completionNote: input.completionNote } : {}),
          ...(input.checklist ? { checklist: input.checklist } : {}),
        },
      });
      await audit(tx, user, input.status ? `work-order.${input.status.toLowerCase()}` : input.checklist ? "work-order.checklist-updated" : "work-order.assigned", "WorkOrder", id, {
        from: order.status, to: input.status ?? order.status,
        assignedUserId: input.assignedUserId !== undefined ? input.assignedUserId : order.assignedUserId,
        ...(input.checklist ? { checklist: input.checklist } : {}),
      });
      if (input.assignedUserId && input.assignedUserId !== order.assignedUserId) {
        await tx.notification.create({
          data: { userId: input.assignedUserId, workOrderId: id, message: `You were assigned: ${order.title}` },
        });
      }
      return changed;
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ workOrder: updated });
  } catch (error) {
    return jsonError(error);
  }
}
