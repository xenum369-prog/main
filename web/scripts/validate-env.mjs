import { readFile } from "node:fs/promises";
import { parseEnvFile, validateEnvironment } from "./env-config.mjs";

let fileValues = {};
try {
  fileValues = parseEnvFile(await readFile(new URL("../.env", import.meta.url), "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const env = { ...fileValues, ...process.env };
const issues = validateEnvironment(env, { docker: process.argv.includes("--docker") });
if (issues.length) {
  console.error("Environment configuration needs attention:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log("Environment configuration is valid. Secret values were not displayed.");
}
