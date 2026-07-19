
DROP POLICY "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (length(email) BETWEEN 5 AND 254 AND email LIKE '%_@_%.__%');
