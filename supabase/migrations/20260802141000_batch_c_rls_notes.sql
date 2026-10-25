-- Batch C: RLS sanity notes + ensure demo_requests stays locked down for SELECT
-- Apply in Supabase SQL editor after Batch B migration (idempotent).

-- demo_requests: no SELECT for anon/authenticated (admin uses service role)
drop policy if exists "demo_requests_select_none" on public.demo_requests;
-- Explicit deny via no SELECT policies is enough when RLS is enabled.

-- Already shipped in 20260719224722_*:
-- 1) businesses: owner_id = auth.uid()
-- 2) leads, bookings: EXISTS (businesses b WHERE b.id = …business_id AND b.owner_id = auth.uid())
-- 3) subscriptions: owners SELECT own; admins SELECT all
-- 4) Public booking INSERT policy exists separately (anon insert only)

-- Manual spot-check in SQL editor if inserts fail:
-- select polname, tablename from pg_policies where schemaname = 'public'
--   and tablename in ('leads','calls','bookings','subscriptions','businesses','demo_requests');
