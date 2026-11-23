import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  assertSameOrigin(request);
  await destroySession();
  return NextResponse.json({ ok: true });
}
