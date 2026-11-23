import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { currentUser, NO_LOCATION_ID } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const technicians = await db.user.findMany({
    where: {
      organizationId: user.organizationId,
      role: Role.TECHNICIAN,
      active: true,
      ...(user.role === Role.ADMIN ? {} : { locationId: user.locationId ?? NO_LOCATION_ID }),
    },
    select: { id: true, name: true, locationId: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ technicians });
}
