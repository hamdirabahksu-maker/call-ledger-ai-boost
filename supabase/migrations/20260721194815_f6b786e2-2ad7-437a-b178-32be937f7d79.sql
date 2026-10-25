
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
