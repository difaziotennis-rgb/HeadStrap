-- Summer ’27 shared data (run in Supabase SQL editor when you’re ready).
-- Until these tables exist, the club UI keeps using browser localStorage.

create table if not exists s27_payments (
  booking_id text primary key,
  payment_intent_id text,
  email text,
  amount numeric,
  status text not null default 'paid',
  source text,
  updated_at timestamptz not null default now()
);

create table if not exists s27_members (
  member_number text primary key,
  name text not null,
  email text not null unique,
  phone text,
  password_hash text,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  directory_visible boolean default false,
  preferred_contact text,
  directory_note text,
  children jsonb default '[]'::jsonb
);

create table if not exists s27_payment_methods (
  member_number text primary key references s27_members(member_number) on delete cascade,
  stripe_customer_id text,
  stripe_payment_method_id text,
  brand text,
  last4 text,
  exp_month text,
  exp_year text,
  billing_zip text,
  updated_at timestamptz not null default now()
);

create table if not exists s27_bookings (
  id text primary key,
  kind text not null, -- court | clinic | lesson | event | stringing | charge
  payload jsonb not null,
  payment_status text not null default 'pending',
  payment_intent_id text,
  member_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists s27_bookings_kind_idx on s27_bookings (kind);
create index if not exists s27_bookings_member_idx on s27_bookings (member_number);
