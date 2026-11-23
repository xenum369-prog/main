import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { db } from "@/lib/prisma";

export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-maintenance_session" : "maintenance_session";
export const NO_LOCATION_ID = "00000000-0000-4000-8000-000000000000";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!value || value.length < 32)) {
    throw new Error("SESSION_SECRET must contain at least 32 characters in production.");
  }
  return value || "development-only-session-secret-change-me";
}

export function digestToken(token: string) {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

export function digestRateLimit(value: string) {
  return createHash("sha256").update(`${secret()}:${value}`).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { userId, tokenHash: digestToken(token), expiresAt } });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: digestToken(token) } });
  store.delete(SESSION_COOKIE);
}

export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findFirst({
    where: { tokenHash: digestToken(token), expiresAt: { gt: new Date() } },
    include: { user: { include: { location: true } } },
  });
  if (!session?.user.active) return null;
  return session.user;
}

export type AuthUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export function canManage(user: AuthUser) {
  return user.role === Role.ADMIN || user.role === Role.MANAGER;
}

export function locationFilter(user: AuthUser) {
  return user.role === Role.ADMIN ? {} : { locationId: user.locationId ?? NO_LOCATION_ID };
}

export function requireRole(user: AuthUser, roles: Role[]) {
  if (!roles.includes(user.role)) throw new ApiError(403, "Forbidden");
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
