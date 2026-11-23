import { WorkOrderStatus } from "@prisma/client";

export const allowedTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  OPEN: ["IN_PROGRESS", "ON_HOLD", "CLOSED"],
  IN_PROGRESS: ["ON_HOLD", "COMPLETED"],
  ON_HOLD: ["IN_PROGRESS", "CLOSED"],
  COMPLETED: ["VERIFIED", "IN_PROGRESS"],
  VERIFIED: ["CLOSED"],
  CLOSED: [],
};

export function isAllowedTransition(from: WorkOrderStatus, to: WorkOrderStatus) {
  return allowedTransitions[from].includes(to);
}
