import { Prisma, type User } from "@prisma/client";
import { ApiError, digestToken } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function idempotent<T>(
  user: Pick<User, "id" | "organizationId">,
  key: string,
  fingerprint: unknown,
  create: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  const requestHash = digestToken(JSON.stringify(stableValue(fingerprint)));
  const existing = await db.idempotencyRecord.findUnique({
    where: { organizationId_key: { organizationId: user.organizationId, key } },
  });
  if (existing) {
    if (existing.requestHash !== requestHash) throw new ApiError(409, "Idempotency key was already used with different input");
    return existing.response as T;
  }
  try {
    return await db.$transaction(async (tx) => {
      const entity = await create(tx);
      await tx.idempotencyRecord.create({
        data: { organizationId: user.organizationId, key, requestHash, response: JSON.parse(JSON.stringify(entity)) as Prisma.InputJsonValue },
      });
      return entity;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const replay = await db.idempotencyRecord.findUnique({
        where: { organizationId_key: { organizationId: user.organizationId, key } },
      });
      if (replay) {
        if (replay.requestHash !== requestHash) throw new ApiError(409, "Idempotency key was already used with different input");
        return replay.response as T;
      }
      throw new ApiError(409, "Duplicate operation; retry with the same idempotency key");
    }

    throw error;
  }
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  }
  return value;
}
