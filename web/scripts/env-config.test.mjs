import { describe, expect, it } from "vitest";
import path from "node:path";
import { parseEnvFile, validateEnvironment } from "./env-config.mjs";

const validEnv = {
  DATABASE_URL: "postgresql://maintenance:a-unique-local-postgres-password@localhost:5432/maintenance?schema=public",
  SESSION_SECRET: "a-unique-session-secret-that-is-at-least-32-characters",
  POSTGRES_PASSWORD: "a-unique-local-postgres-password",
};

describe("environment setup validation", () => {
  it("parses quoted values and ignores comments", () => {
    expect(parseEnvFile('SESSION_SECRET="long secret value" # note\n# ignored\nKEY=value').SESSION_SECRET).toBe("long secret value");
  });

  it("accepts configured PostgreSQL and session secrets", () => {
    expect(validateEnvironment(validEnv)).toEqual([]);
    expect(validateEnvironment(validEnv, { docker: true })).toEqual([]);
  });

  it("rejects placeholders, weak Docker credentials, and incomplete bootstrap values", () => {
    expect(validateEnvironment({ ...validEnv, DATABASE_URL: "postgresql://user:change-me@localhost:5432/app" }).join(" ")).toContain("placeholder or weak password");
    expect(validateEnvironment({ ...validEnv, POSTGRES_PASSWORD: "replace-me" }, { docker: true }).join(" ")).toContain("POSTGRES_PASSWORD");
    expect(validateEnvironment({ ...validEnv, BOOTSTRAP_ADMIN_EMAIL: "admin@example.com" }).join(" ")).toContain("Set both BOOTSTRAP_ADMIN");
  });

  it("requires private absolute file storage in production", () => {
    const cwd = path.resolve("testapp");
    expect(validateEnvironment({ ...validEnv, NODE_ENV: "production" }, { cwd }).join(" ")).toContain("STORAGE_DIR");
    expect(validateEnvironment({ ...validEnv, NODE_ENV: "production", STORAGE_DIR: path.join(cwd, "public", "uploads") }, { cwd }).join(" ")).toContain("public web directory");
  });
});
