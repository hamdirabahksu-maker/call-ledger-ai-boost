/**
 * Probe whether KYC columns exist (no secrets printed).
 * Usage: node scripts/probe-kyc.mjs
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
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

const env = loadEnv();
const url = (env.SUPABASE_URL || "").replace(/\/$/, "");
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
const token = env.SUPABASE_ACCESS_TOKEN || "";
const ref = env.SUPABASE_PROJECT_ID || env.VITE_SUPABASE_PROJECT_ID || "";

console.log(`project_ref=${ref || "MISSING"}`);
console.log(`access_token=${token ? "SET" : "EMPTY"}`);
console.log(`service_role=${env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "EMPTY"}`);
console.log(`app_url=${env.APP_URL ? "SET" : "EMPTY"}`);

const r = await fetch(`${url}/rest/v1/businesses?select=id,kyc_status&limit=1`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
  },
});
const body = await r.text();
if (r.status === 200) {
  console.log("kyc_columns=EXISTS");
  process.exit(0);
}
if (
  r.status === 400 &&
  /kyc_status|column .* does not exist/i.test(body)
) {
  console.log("kyc_columns=MISSING");
  console.log(`sql_editor=https://supabase.com/dashboard/project/${ref}/sql/new`);
  process.exit(2);
}
console.log(`kyc_probe_status=${r.status}`);
console.log(`kyc_probe_body=${body.slice(0, 240)}`);
process.exit(1);
