import path from "node:path";

export function parseEnvFile(source) {
  const parsed = {};
  for (const line of source.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match || match[2].startsWith("#")) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    parsed[match[1]] = value;
  }
  return parsed;
}

export function validateEnvironment(env, { docker = false, cwd = process.cwd() } = {}) {
  const issues = [];
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    issues.push("Set DATABASE_URL to a reachable PostgreSQL database URL.");
  } else {
    try {
      const url = new URL(databaseUrl);
      if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) {
        issues.push("DATABASE_URL must include a PostgreSQL scheme, host, and database name.");
      } else if (!url.password || ["change-me", "password", "postgres"].includes(decodeURIComponent(url.password).toLowerCase())) {
        issues.push("Replace the placeholder or weak password in DATABASE_URL.");
      } else if (docker && decodeURIComponent(url.password) !== env.POSTGRES_PASSWORD) {
        issues.push("For local Docker setup, the DATABASE_URL password must match POSTGRES_PASSWORD.");
      }
    } catch {
      issues.push("DATABASE_URL is not a valid URL.");
    }
  }

  const sessionSecret = env.SESSION_SECRET ?? "";
  if (sessionSecret.length < 32 || /replace-with|change-me|example/i.test(sessionSecret)) {
    issues.push("Set SESSION_SECRET to at least 32 characters of unique random data; do not use the example placeholder.");
  }

  if (docker && (!env.POSTGRES_PASSWORD || env.POSTGRES_PASSWORD.length < 16 || /replace-with|change-me|example/i.test(env.POSTGRES_PASSWORD))) {
    issues.push("Set POSTGRES_PASSWORD to a unique random value of at least 16 characters for local Docker PostgreSQL.");
  }

  const bootstrapEmail = env.BOOTSTRAP_ADMIN_EMAIL;
  const bootstrapPassword = env.BOOTSTRAP_ADMIN_PASSWORD;
  if (Boolean(bootstrapEmail) !== Boolean(bootstrapPassword)) {
    issues.push("Set both BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD, or leave both unset.");
  }
  if (bootstrapEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bootstrapEmail)) {
    issues.push("BOOTSTRAP_ADMIN_EMAIL must be a valid email address.");
  }
  if (bootstrapPassword && bootstrapPassword.length < 14) {
    issues.push("BOOTSTRAP_ADMIN_PASSWORD must be at least 14 characters.");
  }

  if (env.NODE_ENV === "production") {
    const storage = env.STORAGE_DIR;
    if (!storage || !path.isAbsolute(storage)) {
      issues.push("Production requires STORAGE_DIR to be an absolute private persistent directory.");
    } else {
      const root = path.resolve(storage);
      const publicRoot = path.resolve(cwd, "public") + path.sep;
      if (root === path.resolve(cwd, "public") || root.startsWith(publicRoot)) {
        issues.push("STORAGE_DIR must not be inside the public web directory.");
      }
    }
  }
  return issues;
}
