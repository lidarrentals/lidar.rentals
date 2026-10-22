-- Signed equipment rental agreements. Signature files are stored in the private
-- signed-rental-agreements bucket; this table contains metadata and the immutable
-- terms/order snapshot needed to identify what the customer accepted.
create table if not exists public.rental_agreements (
  id uuid primary key default gen_random_uuid(),
  order_id uuid null references public.orders(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null default '',
  company text not null default '',
  shipping_address text not null default '',
  agreement_version text not null,
  terms_text text not null,
  items_snapshot jsonb not null,
  typed_name text not null,
  signature_object_path text not null,
  accepted_at timestamptz not null default now(),
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

alter table public.rental_agreements enable row level security;

-- No anon/authenticated policies: signed records are written by the server using
-- the service-role key and are not directly readable from the browser.
revoke all on public.rental_agreements from anon, authenticated;
grant all on public.rental_agreements to service_role;

create index if not exists idx_rental_agreements_email_created
  on public.rental_agreements (lower(customer_email), created_at desc);
create index if not exists idx_rental_agreements_order_id
  on public.rental_agreements (order_id);
