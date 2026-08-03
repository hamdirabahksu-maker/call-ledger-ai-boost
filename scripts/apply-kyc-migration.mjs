/**
 * Apply only the business KYC migration.
 * Needs SUPABASE_ACCESS_TOKEN (Account → Access Tokens).
 * Usage: node scripts/apply-kyc-migration.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const env = {};
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) throw new Error("Missing .env");
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    let k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const env = loadEnv();
const ref = env.SUPABASE_PROJECT_ID || env.VITE_SUPABASE_PROJECT_ID;
const token = env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN;
const sqlPath = resolve(
  process.cwd(),
  "supabase/migrations/20260803200000_business_kyc.sql",
);

if (!ref) {
  console.error("Missing SUPABASE_PROJECT_ID in .env");
  process.exit(1);
}

if (!existsSync(sqlPath)) {
  console.error(`Missing ${sqlPath}`);
  process.exit(1);
}

if (!token) {
  console.error(
    [
      "Need SUPABASE_ACCESS_TOKEN to apply KYC SQL from this machine.",
      "1) https://supabase.com/dashboard/account/tokens → Generate",
      "2) Add to .env: SUPABASE_ACCESS_TOKEN=sbp_...",
      "3) Re-run: npm run db:kyc",
      "",
      "One-click paste instead:",
      `https://supabase.com/dashboard/project/${ref}/sql/new`,
      "→ paste file supabase/migrations/20260803200000_business_kyc.sql → Run",
    ].join("\n"),
  );
  process.exit(2);
}

const query = readFileSync(sqlPath, "utf8");
process.stdout.write(`Applying KYC migration to ${ref} ... `);
const res = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  },
);
const text = await res.text();
if (!res.ok) {
  console.log("FAIL");
  console.error(`status=${res.status}`);
  console.error(text.slice(0, 800));
  process.exit(1);
}
console.log("OK");
console.log("businesses.kyc_* columns ready.");
