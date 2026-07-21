
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
