# CallLedger Cursor plugin

Thin Cursor plugin that points at your CallLedger business MCP (`/mcp`).

**Brand:** CallLedger only (charcoal + amber). Not Marketia. Not a third-party skin.

## Local smoke (default)

`mcp.json` ships pointed at **local** CallLedger:

```json
{
  "mcpServers": {
    "callledger": {
      "type": "http",
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

1. In the app folder: `npm run dev` (port **8080** — match `APP_URL` in `.env`).
2. Copy this plugin folder to Cursor local plugins:

```powershell
Copy-Item -Recurse -Force "callledger-cursor-plugin" "$env:USERPROFILE\.cursor\plugins\local\callledger"
```

3. Restart Cursor → connect / authenticate with your CallLedger shop account.
4. Smoke: ask the agent to run `business_summary` or `list_leads`.

If Vite printed a different port (8081…), either free 8080 or edit `mcp.json` to match.

## Production

After deploy, change the URL to your live origin (no trailing slash):

```json
"url": "https://YOUR_PRODUCTION_DOMAIN/mcp"
```

Then re-copy the plugin folder (or edit the installed copy under `%USERPROFILE%\.cursor\plugins\local\callledger`).

## Also useful

- In-app: **Settings → AI / MCP** shows your live `{origin}/mcp` URL.
- Help: `/help/connect-ai-mcp`

## Contents

| Path | Purpose |
|------|---------|
| `.cursor-plugin/plugin.json` | Plugin manifest |
| `.cursor-plugin/mcp.json` | HTTP MCP → `/mcp` (localhost by default) |
| `skills/callledger-mcp/SKILL.md` | When/how to use tools |
| `rules/callledger-mcp.mdc` | Always-on safety rules |
