import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSession, digestRateLimit } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";

const loginSchema = z.object({
  email: z.string().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(200),
});
const dummyPasswordHash = bcrypt.hash(randomBytes(32).toString("base64url"), 12);

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = loginSchema.parse(await readJson(request));
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const bucket = digestRateLimit(`${ip}:${body.email}`);
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 15 * 60 * 1000);
    const updated = await db.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "LoginRateLimit" ("bucket", "count", "windowEnd")
      VALUES (${bucket}, 1, ${windowEnd})
      ON CONFLICT ("bucket") DO UPDATE SET
        "count" = CASE WHEN "LoginRateLimit"."windowEnd" <= ${now} THEN 1 ELSE "LoginRateLimit"."count" + 1 END,
        "windowEnd" = CASE WHEN "LoginRateLimit"."windowEnd" <= ${now} THEN ${windowEnd} ELSE "LoginRateLimit"."windowEnd" END
      RETURNING "count"`;
    if (updated[0]?.count > 10) {
      return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
    }
    await db.$executeRaw`DELETE FROM "LoginRateLimit" WHERE "windowEnd" < ${new Date(now.getTime() - 24 * 60 * 60 * 1000)}`;

    const user = await db.user.findFirst({ where: { email: body.email, active: true } });
    const valid = await bcrypt.compare(body.password, user?.passwordHash ?? await dummyPasswordHash);
    if (!user || !valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    return jsonError(error);
  }
}
