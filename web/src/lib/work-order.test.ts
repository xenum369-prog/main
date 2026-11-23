import { describe, expect, it } from "vitest";
import { isAllowedTransition } from "@/lib/work-order";

describe("work-order lifecycle", () => {
  it("allows valid completion and verification transitions", () => {
    expect(isAllowedTransition("IN_PROGRESS", "COMPLETED")).toBe(true);
    expect(isAllowedTransition("COMPLETED", "VERIFIED")).toBe(true);
    expect(isAllowedTransition("VERIFIED", "CLOSED")).toBe(true);
  });

  it("rejects skipping required states or reopening closed orders", () => {
    expect(isAllowedTransition("OPEN", "COMPLETED")).toBe(false);
    expect(isAllowedTransition("CLOSED", "IN_PROGRESS")).toBe(false);
  });
});
