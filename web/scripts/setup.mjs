import { copyFile, access, chmod, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnvFile } from "./env-config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const windows = process.platform === "win32";
const npm = windows ? "npm.cmd" : "npm";
const withDatabase = process.argv.includes("--with-database");

function run(command, args, quiet = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: quiet ? "ignore" : "inherit", shell: windows });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code ?? "unknown"}`)));
  });
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function prepareLocalSecrets() {
  const envFile = path.join(root, ".env");
  let contents = await readFile(envFile, "utf8");
  const originalContents = contents;
  contents = contents.replace(/\r\n?/g, "\n");
  const values = parseEnvFile(contents);
  const production = process.env.NODE_ENV === "production" || values.NODE_ENV === "production";
  if (production) return;

  const updates = {};
  if (!values.SESSION_SECRET || values.SESSION_SECRET.length < 32 || /replace-with|change-me|example/i.test(values.SESSION_SECRET)) {
    updates.SESSION_SECRET = randomBytes(32).toString("base64url");
  }
  if (withDatabase) {
    const postgresPassword = values.POSTGRES_PASSWORD;
    updates.POSTGRES_PASSWORD = !postgresPassword || postgresPassword.length < 16 || /replace-with|change-me|example/i.test(postgresPassword)
      ? randomBytes(32).toString("base64url")
      : postgresPassword;
    let databaseUrl;
    try {
      databaseUrl = new URL(values.DATABASE_URL);
    } catch {
      throw new Error("DATABASE_URL must be a valid URL before local Docker PostgreSQL can be configured.");
    }
    databaseUrl.protocol = "postgresql:";
    databaseUrl.hostname = "127.0.0.1";
    databaseUrl.port = "5432";
    databaseUrl.username = "maintenance";
    databaseUrl.password = updates.POSTGRES_PASSWORD;
    databaseUrl.pathname = "/maintenance";
    databaseUrl.search = "?schema=public";
    updates.DATABASE_URL = databaseUrl.toString();
  }

  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}="${value}"`;
    const expression = new RegExp(`^\\s*${key}\\s*=.*$`, "m");
    contents = expression.test(contents) ? contents.replace(expression, line) : `${contents.trimEnd()}\n${line}\n`;
  }
  if (Object.keys(updates).length || contents !== originalContents) {
    await writeFile(envFile, contents, { mode: 0o600 });
    if (!windows) await chmod(envFile, 0o600);
    console.log("Generated unique local-only secret values in ignored web/.env; no secret values were displayed.");
  }
}

async function main() {
  if (Number(process.versions.node.split(".")[0]) < 22) {
    throw new Error("Node.js 22 or newer is required. Install Node.js, then rerun this setup.");
  }
  if (withDatabase) {
    try {
      await run("docker", ["compose", "version"], true);
    } catch {
      throw new Error("Docker Compose is required for setup:local. Install Docker Desktop/Compose or use npm run setup with an existing PostgreSQL database.");
    }
  }

  const envFile = path.join(root, ".env");
  if (!(await exists(envFile))) {
    await copyFile(path.join(root, ".env.example"), envFile);
    console.log("Created web/.env from the example. Review it and replace all placeholders before continuing.");
  }
  await prepareLocalSecrets();

  console.log("Installing locked dependencies...");
  await run(npm, ["ci"]);
  console.log("Validating environment configuration...");
  await run(npm, ["run", "env:check", ...(withDatabase ? ["--", "--docker"] : [])]);
  await run(npm, ["run", "db:generate"]);

  if (withDatabase) {
    await run("docker", ["compose", "up", "-d", "db"]);
    console.log("Waiting for the local PostgreSQL container...");
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        await run("docker", ["compose", "exec", "-T", "db", "pg_isready", "-U", "maintenance", "-d", "maintenance"], true);
        ready = true;
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    if (!ready) throw new Error("The PostgreSQL container did not become ready within 60 seconds.");
  }

  await run(npm, ["run", "db:migrate"]);
  console.log("Setup complete: dependencies installed and database migrations applied.");
  console.log("Admin creation is intentionally separate. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD, then run npm run admin:bootstrap.");
  console.log("Demo data is optional and development-only: set ENABLE_DEMO_SEED=true and DEMO_SEED_PASSWORD before running npm run db:seed:demo.");
}

main().catch((error) => {
  console.error(`Setup stopped: ${error.message}`);
  process.exitCode = 1;
});
