import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { ApiError, currentUser, digestRateLimit, requireRole } from "@/lib/auth";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { db } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { contactInquirySchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) throw new ApiError(401, "Authentication required");
    requireRole(user, [Role.ADMIN]);
    const inquiries = await db.contactInquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ inquiries });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = contactInquirySchema.parse(await readJson(request));
    if (input.website) return NextResponse.json({ ok: true }, { status: 201 });
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (await consumeRateLimit(digestRateLimit(`contact:${ip}`), 5, 60 * 60 * 1000) > 5) {
      return NextResponse.json({ error: "Too many inquiries. Please try again later." }, { status: 429 });
    }
    const inquiry = await db.contactInquiry.create({
      data: {
        name: input.name,
        email: input.email,
        organization: input.organization,
        service: input.service,
        message: input.message,
      },
    });
    return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
