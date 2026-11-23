import { NextResponse } from "next/server";
import { currentUser, ApiError } from "@/lib/auth";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { db } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Unauthenticated");
    const { id } = z.object({ id: z.string().uuid() }).parse(await readJson(request));
    const notification = await db.notification.updateMany({
      where: { id, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    if (!notification.count) throw new ApiError(404, "Unread notification not found");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
