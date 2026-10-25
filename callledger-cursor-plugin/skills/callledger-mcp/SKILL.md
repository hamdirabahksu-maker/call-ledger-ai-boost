---
name: callledger-mcp
description: >-
  Use CallLedger business MCP tools for the signed-in shop — leads, bookings,
  customers, invoices, estimates, review requests, missed calls. Trigger when
  the user asks about CallLedger data or actions for their service business.
---

# CallLedger business MCP

## When to use

- User wants CallLedger shop data or actions from Cursor (leads, bookings, invoices, etc.).
- MCP server `callledger` is connected to your CallLedger `/mcp`
  (local default: `http://localhost:8080/mcp`; production: `https://YOUR_DOMAIN/mcp`).

## Rules

- Scope is **this business only** — never invent data for another shop.
- For clinics: scheduling/admin only — **never** give medical advice.
- Never invent SMS or OTP success when Twilio/Verify is not connected.
- Prefer read tools first; confirm before create/write tools.
- Do not mention or wire Marketia or third-party product brands into CallLedger flows.

## Tools (typical)

- `business_summary`, `list_leads`, `create_lead`
- `list_bookings`, `create_booking`, `list_customers`
- `list_missed_calls`, `list_invoices`, `list_estimates`, `list_review_requests`

## Setup reminder

Local smoke uses `http://localhost:8080/mcp` (see plugin `mcp.json`). For production, point that URL at your live origin (no trailing slash). Sign in with the shop owner account when the MCP client prompts for auth.
