import { db } from "@/lib/prisma";

export async function consumeRateLimit(bucket: string, limit: number, windowMs: number) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMs);
  const result = await db.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "LoginRateLimit" ("bucket", "count", "windowEnd")
    VALUES (${bucket}, 1, ${windowEnd})
    ON CONFLICT ("bucket") DO UPDATE SET
      "count" = CASE WHEN "LoginRateLimit"."windowEnd" <= ${now} THEN 1 ELSE "LoginRateLimit"."count" + 1 END,
      "windowEnd" = CASE WHEN "LoginRateLimit"."windowEnd" <= ${now} THEN ${windowEnd} ELSE "LoginRateLimit"."windowEnd" END
    RETURNING "count"`;
  return result[0]?.count ?? 1;
}
