import { describe, expect, it } from "vitest";
import { assertUploadSize, detectUploadType, MAX_UPLOAD_BYTES } from "@/lib/file-policy";

describe("private upload policy", () => {
  it("accepts files only when declared MIME and file signature agree", () => {
    expect(detectUploadType("application/pdf", Buffer.from("%PDF-1.7"))).toEqual({ mimeType: "application/pdf", extension: ".pdf" });
    expect(() => detectUploadType("image/png", Buffer.from("%PDF-1.7"))).toThrow();
    expect(() => detectUploadType("text/html", Buffer.from("<script>"))).toThrow();
  });

  it("accepts files at the limit and rejects empty or oversized uploads", () => {
    expect(() => assertUploadSize(MAX_UPLOAD_BYTES)).not.toThrow();
    expect(() => assertUploadSize(MAX_UPLOAD_BYTES + 1)).toThrow();
    expect(() => assertUploadSize(0)).toThrow();
  });
});
