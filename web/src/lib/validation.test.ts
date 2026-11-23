import { describe, expect, it } from "vitest";
import { assetSchema, decisionSchema, movementSchema, requestSchema } from "@/lib/validation";

describe("API validation", () => {
  it("rejects malformed or oversized request data", () => {
    expect(requestSchema.safeParse({ title: "x", description: "x", priority: "URGENT" }).success).toBe(false);
    expect(requestSchema.safeParse({ title: "Repair pump", description: "Pump is leaking", priority: "HIGH" }).success).toBe(true);
  });

  it("rejects invalid asset identifiers and non-positive inventory movement", () => {
    expect(assetSchema.safeParse({ code: "../x", name: "Pump", category: "Plant", criticality: "HIGH" }).success).toBe(false);
    expect(movementSchema.safeParse({ partId: "nope", type: "ISSUE", quantity: 0, reason: "Issue" }).success).toBe(false);
  });

  it("requires a reason when rejecting a request", () => {
    expect(decisionSchema.safeParse({ status: "REJECTED" }).success).toBe(false);
    expect(decisionSchema.safeParse({ status: "REJECTED", decisionNote: "Duplicate request" }).success).toBe(true);
  });
});
