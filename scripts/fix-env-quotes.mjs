/**
 * Strip UTF-8 BOM and surrounding quotes from .env values.
 * Prints diagnostics only (no secret values).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(process.cwd(), ".env");
let raw = readFileSync(path);
if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
  raw = raw.subarray(3);
}
const text = raw.toString("utf8");
const out = [];
let fixed = 0;

for (const line of text.split(/\r?\n/)) {
  if (!line || line.trim().startsWith("#") || !line.includes("=")) {
    out.push(line);
    continue;
  }
  const i = line.indexOf("=");
  let k = line.slice(0, i).trim().replace(/^\uFEFF/, "");
  let v = line.slice(i + 1);
  if (
    (v.startsWith('"') && v.endsWith('"') && v.length >= 2) ||
    (v.startsWith("'") && v.endsWith("'") && v.length >= 2)
  ) {
    v = v.slice(1, -1);
    fixed += 1;
  }
  out.push(`${k}=${v.trim()}`);
}

writeFileSync(path, out.join("\n") + "\n", "utf8");
console.log(`stripped_quoted_values=${fixed}`);

const env = {};
for (const line of readFileSync(path, "utf8").split(/\n/)) {
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const j = line.indexOf("=");
  env[line.slice(0, j).trim()] = line.slice(j + 1);
}

const url = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || "").trim();
const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || "").trim();

let urlOk = false;
let host = "";
try {
  host = new URL(url).host;
  urlOk = true;
} catch {
  /* ignore */
}

console.log(`url_ok=${urlOk}`);
console.log(`host_is_supabase_co=${host.endsWith("supabase.co")}`);
console.log(`key_is_sb_publishable=${key.startsWith("sb_publishable_")}`);
console.log(`key_is_jwt=${key.startsWith("eyJ")}`);

if (!urlOk || !key) {
  console.log("probe=skipped");
  process.exit(urlOk ? 0 : 1);
}

const base = url.replace(/\/$/, "");
try {
  const r = await fetch(`${base}/auth/v1/health`, { headers: { apikey: key } });
  console.log(`auth_health_status=${r.status}`);
} catch (e) {
  console.log(`auth_health_error=${e?.name || "Error"}`);
}
try {
  const r2 = await fetch(`${base}/rest/v1/`, { headers: { apikey: key } });
  console.log(`rest_status=${r2.status}`);
} catch (e) {
  console.log(`rest_error=${e?.name || "Error"}`);
}
