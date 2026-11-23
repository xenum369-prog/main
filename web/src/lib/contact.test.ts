import { describe, expect, it } from "vitest";
import { contactInquirySchema } from "@/lib/validation";

const inquiry = {
  name: "Jordan Lee",
  email: "JORDAN@example.com",
  organization: "Northwind Facilities",
  service: "Asset reliability",
  message: "We would like to learn about managing maintenance across our locations.",
};

describe("public contact inquiry validation", () => {
  it("normalizes the contact email and accepts a valid inquiry", () => {
    expect(contactInquirySchema.parse(inquiry).email).toBe("jordan@example.com");
  });

  it("rejects malformed, oversized, and unsupported service inquiries", () => {
    expect(contactInquirySchema.safeParse({ ...inquiry, email: "invalid" }).success).toBe(false);
    expect(contactInquirySchema.safeParse({ ...inquiry, service: "Unconfigured provider" }).success).toBe(false);
    expect(contactInquirySchema.safeParse({ ...inquiry, message: "short" }).success).toBe(false);
    expect(contactInquirySchema.safeParse({ ...inquiry, message: "x".repeat(3001) }).success).toBe(false);
  });

  it("supports the honeypot field for automated spam filtering", () => {
    expect(contactInquirySchema.safeParse({ ...inquiry, website: "spam" }).success).toBe(true);
  });
});
