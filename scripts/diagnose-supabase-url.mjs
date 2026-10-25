import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env", "utf8").split(/\n/)) {
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  env[line.slice(0, i).trim()] = line.slice(i + 1);
}

const u = (env.SUPABASE_URL || "").trim();
let host = "";
let urlOk = false;
try {
  host = new URL(u).host;
  urlOk = true;
} catch {
  /* ignore */
}

const pid = (env.SUPABASE_PROJECT_ID || "").trim();
const key = (env.SUPABASE_PUBLISHABLE_KEY || "").trim();

console.log(
  JSON.stringify({
    url_ok: urlOk,
    host,
    has_quotes: u.startsWith('"') || u.startsWith("'"),
    project_id_len: pid.length,
    project_matches_host: Boolean(pid && host.startsWith(pid)),
    key_is_sb_publishable: key.startsWith("sb_publishable_"),
    key_is_jwt: key.startsWith("eyJ"),
    dashboard_hint: pid ? `https://supabase.com/dashboard/project/${pid}` : null,
  }),
);
