import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { ApiError, currentUser, NO_LOCATION_ID } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { db } from "@/lib/prisma";
import { readPrivateFile } from "@/lib/file-storage";
import { uuidSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Unauthenticated");
    const { id } = await context.params;
    uuidSchema.parse(id);
    const attachment = await db.attachment.findFirst({
      where: {
        id, organizationId: user.organizationId,
        ...(user.role === Role.ADMIN ? {} : { locationId: user.locationId ?? NO_LOCATION_ID }),
      },
    });
    if (!attachment) throw new ApiError(404, "Attachment not found");
    if (user.role === Role.REQUESTER) {
      const ownsTarget = attachment.entityType === "MaintenanceRequest"
        ? Boolean(await db.maintenanceRequest.findFirst({ where: { id: attachment.entityId, requesterId: user.id } }))
        : attachment.entityType === "WorkOrder"
          ? Boolean(await db.workOrder.findFirst({ where: { id: attachment.entityId, request: { requesterId: user.id } } }))
          : false;
      if (!ownsTarget) throw new ApiError(404, "Attachment not found");
    }
    if (user.role === Role.TECHNICIAN && attachment.entityType !== "Asset" && !await db.workOrder.findFirst({
      where: { id: attachment.entityId, assignedUserId: user.id },
    })) throw new ApiError(404, "Attachment not found");
    const bytes = await readPrivateFile(attachment.storageKey);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`,
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
