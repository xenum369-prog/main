import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { ApiError, currentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { assertSameOrigin, jsonError } from "@/lib/http";
import { db } from "@/lib/prisma";
import { assertUploadSize, detectUploadType, MAX_UPLOAD_BYTES, removePrivateFile, savePrivateFile } from "@/lib/file-storage";
import { uuidSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const query = new URL(request.url).searchParams;
  const entityType = query.get("entityType");
  const entityId = query.get("entityId");
  if (!entityType || !entityId || !["Asset", "MaintenanceRequest", "WorkOrder"].includes(entityType) || !uuidSchema.safeParse(entityId).success) {
    return NextResponse.json({ error: "A valid attachment target is required" }, { status: 400 });
  }
  const locationId = user.role === Role.ADMIN
    ? await targetLocation(entityType, entityId, user.organizationId)
    : user.locationId;
  if (!locationId || !await targetExists(entityType, entityId, user.organizationId, locationId, user.id, user.role)) {
    return NextResponse.json({ error: "Attachment target not found in your scope" }, { status: 404 });
  }
  const attachments = await db.attachment.findMany({
    where: { organizationId: user.organizationId, locationId, entityType, entityId },
    select: { id: true, originalName: true, mimeType: true, size: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ attachments });
}

export async function POST(request: Request) {
  let storageKey: string | undefined;
  try {
    assertSameOrigin(request);
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Unauthenticated");
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_UPLOAD_BYTES + 128 * 1024) throw new ApiError(413, "Upload request is too large");
    const form = await request.formData();
    const entityType = form.get("entityType");
    const entityId = form.get("entityId");
    const upload = form.get("file");
    const entityName = String(entityType);
    if (!["Asset", "MaintenanceRequest", "WorkOrder"].includes(entityName)) throw new ApiError(400, "Invalid attachment target");
    if (typeof entityId !== "string" || !/^[0-9a-f-]{36}$/i.test(entityId)) throw new ApiError(400, "Invalid attachment target");
    if (!(upload instanceof File)) throw new ApiError(400, "A file is required");
    try { assertUploadSize(upload.size); } catch { throw new ApiError(413, "File size must be between 1 byte and 10 MiB"); }
    const bytes = Buffer.from(await upload.arrayBuffer());
    const type = detectUploadType(upload.type, bytes);

    const locationId = user.role === Role.ADMIN
      ? await targetLocation(entityName, entityId, user.organizationId)
      : user.locationId;
    if (!locationId || !await targetExists(entityName, entityId, user.organizationId, locationId, user.id, user.role)) {
      throw new ApiError(404, "Attachment target not found in your scope");
    }

    storageKey = await savePrivateFile(bytes, type.extension);
    const filename = upload.name.replace(/[\\/\r\n"]/g, "_").slice(0, 180) || "attachment";
    const attachment = await db.$transaction(async (tx) => {
      const created = await tx.attachment.create({
        data: {
          organizationId: user.organizationId, locationId, uploaderId: user.id,
          entityType: entityName, entityId, originalName: filename,
          storageKey: storageKey!, mimeType: type.mimeType, size: bytes.length,
        },
      });
      await audit(tx, user, "attachment.uploaded", "Attachment", created.id, { entityType: entityName, entityId, size: bytes.length });
      return created;
    });
    return NextResponse.json({ attachment: { id: attachment.id, originalName: attachment.originalName, mimeType: attachment.mimeType, size: attachment.size } }, { status: 201 });
  } catch (error) {
    if (storageKey) await removePrivateFile(storageKey).catch((cleanupError) => console.error("Private file cleanup failed", cleanupError));
    return jsonError(error);
  }
}

async function targetLocation(entityType: string, id: string, organizationId: string) {
  if (entityType === "Asset") return (await db.asset.findFirst({ where: { id, organizationId }, select: { locationId: true } }))?.locationId ?? null;
  if (entityType === "MaintenanceRequest") return (await db.maintenanceRequest.findFirst({ where: { id, organizationId }, select: { locationId: true } }))?.locationId ?? null;
  return (await db.workOrder.findFirst({ where: { id, organizationId }, select: { locationId: true } }))?.locationId ?? null;
}

async function targetExists(entityType: string, id: string, organizationId: string, locationId: string, userId: string, role: Role) {
  if (entityType === "Asset") return Boolean(await db.asset.findFirst({ where: { id, organizationId, locationId } }));
  if (entityType === "MaintenanceRequest") return Boolean(await db.maintenanceRequest.findFirst({
    where: { id, organizationId, locationId, ...(role === Role.REQUESTER ? { requesterId: userId } : {}) },
  }));
  return Boolean(await db.workOrder.findFirst({
    where: { id, organizationId, locationId, ...(role === Role.TECHNICIAN ? { assignedUserId: userId } : {}), ...(role === Role.REQUESTER ? { request: { requesterId: userId } } : {}) },
  }));
}
