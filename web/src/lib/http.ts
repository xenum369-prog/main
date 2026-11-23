import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ApiError } from "@/lib/auth";

const MAX_JSON_BYTES = 64 * 1024;

export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new ApiError(415, "Content-Type must be application/json");
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_JSON_BYTES) throw new ApiError(413, "Request body is too large");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Request body is required");
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_JSON_BYTES) {
      await reader.cancel();
      throw new ApiError(413, "Request body is too large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new ApiError(400, "Malformed JSON"); }
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
    return NextResponse.json({ error: "Concurrent update detected; retry the operation" }, { status: 409 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ error: "A record with the same unique value already exists" }, { status: 409 });
  }
  console.error("Unhandled API error", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    if (process.env.NODE_ENV === "production") throw new ApiError(403, "Origin header required");
    return;
  }
  try {
    if (new URL(origin).origin === new URL(request.url).origin) return;
  } catch {
    throw new ApiError(403, "Cross-origin request rejected");
  }
  throw new ApiError(403, "Cross-origin request rejected");
}

export function idempotencyKey(request: Request) {
  const key = request.headers.get("idempotency-key");
  if (!key || key.length < 8 || key.length > 128) {
    throw new ApiError(400, "A valid Idempotency-Key header is required");
  }
  return key;
}
