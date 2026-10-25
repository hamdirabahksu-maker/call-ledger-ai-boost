/**
 * Reports which CallLedger env keys are SET vs EMPTY (never prints values).
 * Usage: node scripts/check-env.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "APP_URL",
  "VITE_APP_URL",
];

const OPTIONAL = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_PROJECT_ID",
  "VITE_SUPABASE_PROJECT_ID",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "TWILIO_VERIFY_SERVICE_SID",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "LOVABLE_API_KEY",
];

const path = resolve(process.cwd(), ".env");
if (!existsSync(path)) {
  console.error("NO_ENV — create .env from .env.example");
  process.exit(1);
}

const map = {};
for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
  if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  const k = line.slice(0, i).trim();
  const v = line.slice(i + 1);
  map[k] = v;
}

function status(key) {
  const v = map[key];
  if (v == null) return "MISSING";
  if (!String(v).trim() || /YOUR_|your_|placeholder|changeme|optional_server/i.test(v)) {
    return "EMPTY";
  }
  const s = String(v);
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return "QUOTED_BAD";
  }
  return "SET";
}

console.log("CallLedger env check (values hidden)\n");
let ok = true;
for (const k of REQUIRED) {
  const s = status(k);
  console.log(`${k}=${s}`);
  if (s !== "SET") ok = false;
}
console.log("--- optional ---");
for (const k of OPTIONAL) {
  console.log(`${k}=${status(k)}`);
}
console.log(ok ? "\nCore auth/DB keys OK for local smoke." : "\nFill REQUIRED keys before npm run dev. If any show QUOTED_BAD, run: node scripts/fix-env-quotes.mjs");
process.exit(ok ? 0 : 1);
