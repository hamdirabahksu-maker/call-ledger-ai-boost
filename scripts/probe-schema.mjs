import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env", "utf8").split(/\n/)) {
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
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

const url = (env.SUPABASE_URL || "").replace(/\/$/, "");
const service = env.SUPABASE_SERVICE_ROLE_KEY || "";
const anon = env.SUPABASE_PUBLISHABLE_KEY || "";
const key = service || anon;

const health = await fetch(`${url}/auth/v1/health`, { headers: { apikey: anon } });
console.log(`auth_health=${health.status}`);

const tables = [
  "businesses",
  "leads",
  "bookings",
  "demo_requests",
  "profiles",
  "customers",
  "estimates",
  "invoices",
  "subscriptions",
  "waitlist",
];

let ok = 0;
let missing = 0;
for (const t of tables) {
  const r = await fetch(`${url}/rest/v1/${t}?select=id&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  const status = r.status;
  // 200 = exists; 401/403 = exists but blocked; 404 = missing relation
  let label = String(status);
  if (status === 200) {
    ok += 1;
    label = "EXISTS";
  } else if (status === 404) {
    missing += 1;
    label = "MISSING";
  } else if (status === 401 || status === 403) {
    ok += 1;
    label = `EXISTS_LOCKED_${status}`;
  }
  console.log(`table_${t}=${label}`);
}

console.log(`summary_ok=${ok} missing=${missing}`);
if (missing > 0) process.exit(2);
