import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export function assertUploadSize(size: number) {
  if (!Number.isInteger(size) || size < 1 || size > MAX_UPLOAD_BYTES) {
    throw new Error("File size must be between 1 byte and 10 MiB");
  }
}

const allowed = {
  "application/pdf": { extension: ".pdf", signature: (b: Buffer) => b.subarray(0, 5).toString("ascii") === "%PDF-" },
  "image/jpeg": { extension: ".jpg", signature: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { extension: ".png", signature: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
} as const;

export function detectUploadType(declaredType: string, bytes: Buffer) {
  const definition = allowed[declaredType as keyof typeof allowed];
  if (!definition || !definition.signature(bytes)) throw new Error("Only valid PDF, JPEG, and PNG files are accepted");
  return { mimeType: declaredType, extension: definition.extension };
}

function storageRoot() {
  const configured = process.env.STORAGE_DIR;
  if (process.env.NODE_ENV === "production" && (!configured || !path.isAbsolute(configured))) {
    throw new Error("Production requires STORAGE_DIR to be an absolute private persistent directory.");
  }
  const root = path.resolve(/*turbopackIgnore: true*/ configured ?? path.join(process.cwd(), "private-storage"));
  const publicRoot = path.resolve(process.cwd(), "public") + path.sep;
  if (root === path.resolve(process.cwd(), "public") || root.startsWith(publicRoot)) {
    throw new Error("STORAGE_DIR must not be inside the public web root.");
  }
  return root;
}

export async function savePrivateFile(bytes: Buffer, extension: string) {
  const root = storageRoot();
  await mkdir(root, { recursive: true, mode: 0o700 });
  const storageKey = `${randomUUID()}${extension}`;
  const fullPath = path.resolve(root, storageKey);
  if (path.dirname(fullPath) !== root) throw new Error("Invalid generated storage key.");
  await writeFile(fullPath, bytes, { flag: "wx", mode: 0o600 });
  return storageKey;
}

export async function readPrivateFile(storageKey: string) {
  const root = storageRoot();
  const fullPath = path.resolve(root, storageKey);
  if (path.dirname(fullPath) !== root || !/^[0-9a-f-]{36}\.(pdf|jpg|png)$/.test(storageKey)) {
    throw new Error("File not found");
  }
  return readFile(/*turbopackIgnore: true*/ fullPath);
}

export async function removePrivateFile(storageKey: string) {
  const fullPath = path.resolve(storageRoot(), storageKey);
  if (path.dirname(fullPath) !== storageRoot()) throw new Error("Invalid generated storage key.");
  await unlink(fullPath);
}
