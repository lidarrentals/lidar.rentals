-- Signed equipment-rental agreement records.
-- The API writes with SUPABASE_SERVICE_ROLE_KEY; browser roles receive no table access.
-- The private Storage bucket is never made public by this migration.

create table if not exists public.rental_agreements (
  id uuid primary key,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null default '',
  company text not null default '',
  shipping_address text not null default '',
  agreement_version text not null,
  terms_text text not null,
  items_snapshot jsonb not null,
  typed_name text not null,
  signature_object_path text not null unique,
  accepted_at timestamptz not null,
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

alter table public.rental_agreements enable row level security;

-- No anon/authenticated policies are intentionally created. Only trusted server
-- code using the Supabase service-role key may insert or read these records.
revoke all on table public.rental_agreements from anon, authenticated;
grant all on table public.rental_agreements to service_role;

insert into storage.buckets (id, name, public)
values ('signed-rental-agreements', 'signed-rental-agreements', false)
on conflict (id) do update set public = false;
