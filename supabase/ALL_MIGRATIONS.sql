-- CallLedger FULL schema for a NEW empty Supabase project
-- Project ref: ojznlaarxestwwpredve
-- Paste ALL of this into SQL Editor and click Run once

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- section: 20260719202646_4f4e7252-c1a4-4e20-97ca-1f718d93f665.sql
-- Waitlist (public can insert; only service_role can read)
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  trade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.waitlist TO anon, authenticated;
GRANT ALL ON public.waitlist TO service_role;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Businesses (one per owner)
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trade TEXT NOT NULL,
  phone TEXT,
  service_area TEXT,
  after_hours_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own business" ON public.businesses FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.tg_touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER businesses_touch BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();


-- section: 20260719202656_37ed9f0f-2726-49f0-9022-6d90b7e4af9a.sql
DROP POLICY "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (length(email) BETWEEN 5 AND 254 AND email LIKE '%_@_%.__%');


-- section: 20260719224722_b18ff24d-2eca-4b5e-9294-5b7ea8ae8440.sql
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('owner', 'admin');

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security-definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- Admin helper: role=admin OR founder email
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id AND email = 'hamdi.rabahksu@gmail.com');
$$;

-- profiles policies
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- user_roles policies
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins see all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Auto-create profile on signup + auto-grant admin to founder email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner')
  ON CONFLICT DO NOTHING;
  IF NEW.email = 'hamdi.rabahksu@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing users + founder admin
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users ON CONFLICT (id) DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'::public.app_role FROM auth.users ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'hamdi.rabahksu@gmail.com'
ON CONFLICT DO NOTHING;

-- Admin can read waitlist + businesses
CREATE POLICY "Admins read waitlist" ON public.waitlist FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins read businesses" ON public.businesses FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  issue TEXT,
  estimated_value INT DEFAULT 0,
  source TEXT,
  urgency TEXT NOT NULL DEFAULT 'med' CHECK (urgency IN ('high','med','low')),
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own leads" ON public.leads FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = leads.business_id AND b.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = leads.business_id AND b.owner_id = auth.uid()));
CREATE POLICY "Admins read all leads" ON public.leads FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- calls
CREATE TABLE public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  from_number TEXT NOT NULL,
  recovered BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calls TO authenticated;
GRANT ALL ON public.calls TO service_role;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own calls" ON public.calls FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = calls.business_id AND b.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = calls.business_id AND b.owner_id = auth.uid()));
CREATE POLICY "Admins read all calls" ON public.calls FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  job TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  value_cents INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own bookings" ON public.bookings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = bookings.business_id AND b.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = bookings.business_id AND b.owner_id = auth.uid()));
CREATE POLICY "Admins read all bookings" ON public.bookings FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT CHECK (plan IN ('pilot','starter','growth')),
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own subscription" ON public.subscriptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = subscriptions.business_id AND b.owner_id = auth.uid()));
CREATE POLICY "Admins read all subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- updated_at triggers
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();


-- section: 20260719224735_f2f7dd38-9868-478c-8be8-22122f1184a4.sql
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;


-- section: 20260721072646_3261fd94-0c82-494f-9099-6d4b51bf4325.sql
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS country TEXT;

CREATE TABLE IF NOT EXISTS public.marketing_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  prompt TEXT,
  content TEXT NOT NULL,
  channel TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_drafts TO authenticated;
GRANT ALL ON public.marketing_drafts TO service_role;

ALTER TABLE public.marketing_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own drafts" ON public.marketing_drafts
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins read drafts" ON public.marketing_drafts
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS marketing_drafts_business_idx ON public.marketing_drafts(business_id, created_at DESC);


-- section: 20260721194815_f6b786e2-2ad7-437a-b178-32be937f7d79.sql
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS ends_at timestamptz;

ALTER TABLE public.bookings RENAME COLUMN scheduled_at TO starts_at;

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS booking_slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS booking_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS slot_minutes int NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS buffer_minutes int NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS availability jsonb NOT NULL DEFAULT '{"mon":["09:00","17:00"],"tue":["09:00","17:00"],"wed":["09:00","17:00"],"thu":["09:00","17:00"],"fri":["09:00","17:00"],"sat":null,"sun":null}'::jsonb;

-- Backfill slugs for existing businesses
UPDATE public.businesses
SET booking_slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 6)
WHERE booking_slug IS NULL;

-- Public read for booking pages (only when enabled)
DROP POLICY IF EXISTS "Public can view businesses with booking enabled" ON public.businesses;
CREATE POLICY "Public can view businesses with booking enabled"
  ON public.businesses FOR SELECT
  TO anon, authenticated
  USING (booking_enabled = true AND booking_slug IS NOT NULL);

GRANT SELECT ON public.businesses TO anon;

-- Allow public inserts into bookings for the public booking page
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;
CREATE POLICY "Public can create bookings"
  ON public.bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (source = 'public' AND business_id IN (SELECT id FROM public.businesses WHERE booking_enabled = true));

GRANT INSERT ON public.bookings TO anon;

-- Public can read their own booking they just created is not needed; skip.


-- section: 20260722063717_f8300dce-e68e-48a5-a242-abc670966ef5.sql
-- CUSTOMERS
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX customers_business_idx ON public.customers(business_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY customers_owner_all ON public.customers FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE TRIGGER customers_touch BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- ESTIMATES
CREATE TABLE public.estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  title TEXT NOT NULL DEFAULT 'Estimate',
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  public_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX estimates_business_idx ON public.estimates(business_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estimates TO authenticated;
GRANT SELECT, UPDATE ON public.estimates TO anon;
GRANT ALL ON public.estimates TO service_role;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY estimates_owner_all ON public.estimates FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
-- Note: public token read/accept flows go through server functions with the admin client.
CREATE TRIGGER estimates_touch BEFORE UPDATE ON public.estimates
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- INVOICES
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  estimate_id UUID REFERENCES public.estimates(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  title TEXT NOT NULL DEFAULT 'Invoice',
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  amount_paid_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  public_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX invoices_business_idx ON public.invoices(business_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_owner_all ON public.invoices FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE TRIGGER invoices_touch BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- REVIEW REQUESTS
CREATE TABLE public.review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT,
  google_review_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX review_requests_business_idx ON public.review_requests(business_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_requests TO authenticated;
GRANT ALL ON public.review_requests TO service_role;
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY review_requests_owner_all ON public.review_requests FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE TRIGGER review_requests_touch BEFORE UPDATE ON public.review_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- BUSINESSES: add google_review_url
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_review_url TEXT;


-- section: 20260802140000_batch_b_otp_demo_logo.sql
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


-- section: 20260802141000_batch_c_rls_notes.sql
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

-- Extra: unique owner for onboarding upsert
CREATE UNIQUE INDEX IF NOT EXISTS businesses_owner_id_uidx ON public.businesses (owner_id);


-- section: 20260803200000_business_kyc.sql
-- CallLedger business KYC (v1 soft gate)
alter table public.businesses
  add column if not exists kyc_status text not null default 'pending'
    check (kyc_status in ('pending', 'submitted', 'verified', 'rejected')),
  add column if not exists kyc_legal_name text,
  add column if not exists kyc_registration_id text,
  add column if not exists kyc_doc_url text,
  add column if not exists kyc_submitted_at timestamptz,
  add column if not exists kyc_reviewed_at timestamptz,
  add column if not exists kyc_notes text;

comment on column public.businesses.kyc_status is 'Business identity KYC: pending|submitted|verified|rejected';
