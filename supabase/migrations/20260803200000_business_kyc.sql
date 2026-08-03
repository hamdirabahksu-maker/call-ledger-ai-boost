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
