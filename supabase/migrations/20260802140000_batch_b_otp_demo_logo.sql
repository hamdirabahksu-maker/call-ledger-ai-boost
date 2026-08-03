-- Reality Pass Batch B: phone verify, logo, demo requests
alter table public.businesses
  add column if not exists phone_verified_at timestamptz,
  add column if not exists logo_url text;

create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  business_name text,
  trade text,
  message text,
  created_at timestamptz not null default now()
);

alter table public.demo_requests enable row level security;

-- Anyone can submit a demo request (public form)
drop policy if exists "demo_requests_public_insert" on public.demo_requests;
create policy "demo_requests_public_insert"
  on public.demo_requests for insert
  to anon, authenticated
  with check (true);

-- No public select — admins use service role
drop policy if exists "demo_requests_no_public_select" on public.demo_requests;

-- RLS sanity: ensure owner-scoped tables stay owner-only (idempotent notes)
-- Existing policies on businesses/leads/bookings/subscriptions assumed; verify in Cloud if inserts fail.

-- Needed for onboarding upsert ({ onConflict: "owner_id" })
CREATE UNIQUE INDEX IF NOT EXISTS businesses_owner_id_uidx ON public.businesses (owner_id);
