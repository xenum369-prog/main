import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { scopedLocation } from "@/lib/permissions";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const locationId = scopedLocation(user);
  const scope = { organizationId: user.organizationId, locationId };
  const orderScope = {
    ...scope,
    ...(user.role === Role.TECHNICIAN ? { assignedUserId: user.id } : {}),
    ...(user.role === Role.REQUESTER ? { request: { requesterId: user.id } } : {}),
  };
  const reviewScope = { ...scope, ...(user.role === Role.REQUESTER ? { requesterId: user.id } : {}) };
  const [assets, openRequests, activeOrders, parts, workloadCounts, recentAudit] = await Promise.all([
    db.asset.count({ where: scope }),
    db.maintenanceRequest.count({ where: { ...reviewScope, status: "SUBMITTED" } }),
    db.workOrder.count({ where: { ...orderScope, status: { in: ["OPEN", "IN_PROGRESS", "ON_HOLD"] } } }),
    user.role === Role.ADMIN || user.role === Role.MANAGER || user.role === Role.TECHNICIAN
      ? db.part.findMany({ where: scope, select: { quantityOnHand: true, reorderPoint: true } })
      : Promise.resolve([]),
    user.role === Role.REQUESTER ? Promise.resolve([]) : db.workOrder.groupBy({
      by: ["assignedUserId"],
      where: {
        ...scope,
        ...(user.role === Role.TECHNICIAN ? { assignedUserId: user.id } : {}),
        assignedUserId: { not: null },
        status: { in: ["OPEN", "IN_PROGRESS", "ON_HOLD"] },
      },
      _count: { _all: true },
    }),
    user.role === Role.ADMIN || user.role === Role.MANAGER
      ? db.auditEvent.findMany({
          where: {
            organizationId: user.organizationId,
            ...(user.role === Role.ADMIN ? {} : { locationId }),
          },
          select: { id: true, action: true, entityType: true, entityId: true, createdAt: true, actor: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
  ]);
  const workload = await Promise.all(workloadCounts.flatMap((entry) => entry.assignedUserId
    ? [db.user.findFirst({
        where: { id: entry.assignedUserId, organizationId: user.organizationId },
        select: { name: true },
      }).then((assignee) => ({ name: assignee?.name ?? "Inactive technician", count: entry._count._all }))]
    : []));
  return NextResponse.json({
    counts: { assets, openRequests, activeOrders, lowStock: parts.filter((part) => part.quantityOnHand <= part.reorderPoint).length },
    workload,
    recentAudit,
  });
}
