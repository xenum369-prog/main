import type { Prisma, User } from "@prisma/client";
import { db } from "@/lib/prisma";

export async function audit(
  tx: Prisma.TransactionClient,
  user: Pick<User, "id" | "organizationId"> & { locationId?: string | null },
  action: string,
  entityType: string,
  entityId: string,
  details: Prisma.InputJsonValue,
) {
  await tx.auditEvent.create({
    data: { organizationId: user.organizationId, locationId: user.locationId ?? null, actorId: user.id, action, entityType, entityId, details },
  });
}

export async function writeAudit(
  user: Pick<User, "id" | "organizationId"> & { locationId?: string | null },
  action: string,
  entityType: string,
  entityId: string,
  details: Prisma.InputJsonValue,
) {
  return db.$transaction((tx) => audit(tx, user, action, entityType, entityId, details));
}
