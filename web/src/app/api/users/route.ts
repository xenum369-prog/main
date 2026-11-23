import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { z } from "zod";
import { ApiError, currentUser, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { assertSameOrigin, idempotencyKey, jsonError, readJson } from "@/lib/http";
import { idempotent } from "@/lib/idempotency";
import { db } from "@/lib/prisma";

const userSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(14).max(200),
  role: z.enum(["MANAGER", "TECHNICIAN", "REQUESTER"]),
});

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (user.role !== Role.ADMIN) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await db.user.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, name: true, email: true, role: true, active: true, location: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await currentUser();
    if (!actor) throw new ApiError(401, "Unauthenticated");
    requireRole(actor, [Role.ADMIN]);
    if (!actor.locationId) throw new ApiError(403, "Administrator must belong to a location");
    const input = userSchema.parse(await readJson(request));
    const key = idempotencyKey(request);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const result = await idempotent(actor, `user:${key}`, input, async (tx) => {
      const created = await tx.user.create({
        data: {
          organizationId: actor.organizationId, locationId: actor.locationId!, name: input.name,
          email: input.email, role: input.role, passwordHash,
        },
        select: { id: true, name: true, email: true, role: true, active: true },
      });
      await audit(tx, actor, "user.created", "User", created.id, { email: created.email, role: created.role });
      return created;
    });
    return NextResponse.json({ user: result }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
