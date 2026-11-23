import { ApiError } from "@/lib/auth";
export { MAX_UPLOAD_BYTES, assertUploadSize, savePrivateFile, removePrivateFile } from "@/lib/file-policy";
import { readPrivateFile as readFile, detectUploadType as detectType } from "@/lib/file-policy";

export async function readPrivateFile(key: string) {
  try { return await readFile(key); } catch { throw new ApiError(404, "File not found"); }
}

export function detectUploadType(type: string, bytes: Buffer) {
  try { return detectType(type, bytes); } catch { throw new ApiError(415, "Only valid PDF, JPEG, and PNG files are accepted"); }
}
