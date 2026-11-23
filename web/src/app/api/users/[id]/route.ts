import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { z } from "zod";
import { ApiError, currentUser, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { db } from "@/lib/prisma";
import { uuidSchema } from "@/lib/validation";

const updateSchema = z.object({
  active: z.boolean().optional(),
  password: z.string().min(14).max(200).optional(),
}).refine((value) => value.active !== undefined || value.password !== undefined);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await currentUser();
    if (!actor) throw new ApiError(401, "Unauthenticated");
    requireRole(actor, [Role.ADMIN]);
    const { id } = await context.params;
    uuidSchema.parse(id);
    const input = updateSchema.parse(await readJson(request));
    if (id === actor.id && input.active === false) throw new ApiError(409, "You cannot deactivate your own account");
    const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : undefined;
    const changed = await db.$transaction(async (tx) => {
      const target = await tx.user.findFirst({ where: { id, organizationId: actor.organizationId } });
      if (!target) throw new ApiError(404, "User not found");
      if (target.role === Role.ADMIN && target.active && input.active === false) {
        const activeAdmins = await tx.user.count({
          where: { organizationId: actor.organizationId, role: Role.ADMIN, active: true },
        });
        if (activeAdmins <= 1) throw new ApiError(409, "The last active administrator cannot be deactivated");
      }
      const updated = await tx.user.update({
        where: { id },
        data: { ...(input.active !== undefined ? { active: input.active } : {}), ...(passwordHash ? { passwordHash } : {}) },
        select: { id: true, name: true, email: true, role: true, active: true },
      });
      if (input.active === false || passwordHash) await tx.session.deleteMany({ where: { userId: id } });
      await audit(tx, actor, input.active === false ? "user.deactivated" : input.active === true ? "user.activated" : "user.password-reset", "User", id, {});
      return updated;
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ user: changed });
  } catch (error) {
    return jsonError(error);
  }
}
