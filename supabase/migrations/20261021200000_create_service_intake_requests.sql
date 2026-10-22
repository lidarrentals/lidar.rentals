-- Services are requests requiring manual review; they are not equipment orders and are never paid at submission.
create table if not exists public.service_intake_requests (
  id uuid primary key default gen_random_uuid(),
  service_id uuid,
  service_name text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null default '',
  company text not null default '',
  site_address text not null default '',
  start_date date not null,
  end_date date not null,
  service_period text not null,
  quoted_price numeric(12,2),
  notes text not null default '',
  status text not null default 'pending_review' check (status in ('pending_review','approved','declined','cancelled')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_notes text
);
alter table public.service_intake_requests enable row level security;
revoke all on table public.service_intake_requests from anon, authenticated;
grant all on table public.service_intake_requests to service_role;
