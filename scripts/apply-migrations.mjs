/**
 * Apply CallLedger SQL migrations to the project in .env.
 * Prefers SUPABASE_ACCESS_TOKEN (Account → Access Tokens) via Management API.
 * Usage: node scripts/apply-migrations.mjs
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

function loadEnv() {
  const env = {};
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) throw new Error("Missing .env");
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    let k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const env = loadEnv();
const ref = env.SUPABASE_PROJECT_ID || env.VITE_SUPABASE_PROJECT_ID;
const token = env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN;

if (!ref) {
  console.error("Missing SUPABASE_PROJECT_ID in .env");
  process.exit(1);
}

if (!token) {
  console.error(
    [
      "Need SUPABASE_ACCESS_TOKEN to apply SQL from this machine.",
      "1) Open https://supabase.com/dashboard/account/tokens",
      "2) Generate a token",
      "3) Add to .env: SUPABASE_ACCESS_TOKEN=sbp_...",
      "4) Re-run: node scripts/apply-migrations.mjs",
      "",
      "Or paste supabase/migrations/*.sql (oldest first) in SQL Editor:",
      `https://supabase.com/dashboard/project/${ref}/sql/new`,
    ].join("\n"),
  );
  process.exit(2);
}

const dir = resolve(process.cwd(), "supabase/migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

console.log(`project_ref=${ref}`);
console.log(`migrations=${files.length}`);

for (const file of files) {
  const query = readFileSync(join(dir, file), "utf8");
  const name = file.replace(/\.sql$/, "").replace(/[^a-zA-Z0-9_]+/g, "_").toLowerCase();
  process.stdout.write(`Applying ${file} ... `);
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.log("FAIL");
    console.error(`status=${res.status}`);
    console.error(text.slice(0, 500));
    process.exit(1);
  }
  console.log("OK");
}

console.log("All migrations applied.");
