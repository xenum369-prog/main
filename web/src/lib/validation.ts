import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const titleSchema = z.string().trim().min(3).max(120);
export const shortTextSchema = z.string().trim().min(1).max(500);
export const requestSchema = z.object({
  title: titleSchema,
  description: z.string().trim().min(5).max(4000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  assetId: uuidSchema.nullable().optional(),
});
export const assetSchema = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
  name: titleSchema,
  category: shortTextSchema.max(80),
  criticality: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});
export const decisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  decisionNote: z.string().trim().max(1000).optional(),
}).refine((value) => value.status !== "REJECTED" || Boolean(value.decisionNote?.trim()), {
  path: ["decisionNote"],
  message: "A reason is required when rejecting a request",
});
export const assignmentSchema = z.object({
  assignedUserId: uuidSchema.nullable().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "VERIFIED", "CLOSED"]).optional(),
  completionNote: z.string().trim().max(2000).optional(),
  checklist: z.array(z.object({ label: z.string().trim().min(1).max(120), done: z.boolean() })).max(30).optional(),
});
export const partSchema = z.object({
  sku: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
  name: titleSchema,
  openingQuantity: z.number().int().min(0).max(100000),
  reorderPoint: z.number().int().min(0).max(100000),
});
export const movementSchema = z.object({
  partId: uuidSchema,
  type: z.enum(["RECEIPT", "ISSUE"]),
  quantity: z.number().int().min(1).max(10000),
  reason: z.string().trim().min(2).max(300),
  workOrderId: uuidSchema.optional(),
});
