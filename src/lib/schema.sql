-- SSK Merch — Postgres schema
-- Run once manually in Neon SQL editor: https://console.neon.tech
-- Do NOT auto-execute this from application code.

create extension if not exists "pgcrypto";

-- Alumni registrations (migrated from local JSON file)
create table if not exists registrations (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  first_name    text not null,
  last_name     text not null,
  email         text not null,
  phone         text not null,
  school_number text not null,
  batch         text not null,
  created_at    timestamptz default now()
);

-- Authenticated users (separate from registrations)
-- A user must register first, then verify email, then set a password
-- before a row appears here
create table if not exists users (
  id             uuid primary key default gen_random_uuid(),
  email          text unique not null,
  password_hash  text not null,
  email_verified boolean default false,
  created_at     timestamptz default now()
);

-- Orders
create table if not exists orders (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references users(id),
  customer_name         text not null,
  phone                 text not null,
  email                 text not null,
  address_line1         text not null,
  address_line2         text,
  city                  text not null,
  state                 text not null,
  pincode               text not null,
  notes                 text,
  status                text default 'pending',
  -- status values: pending | packed | shipped | delivered
  total_amount          numeric not null,
  razorpay_order_id     text,
  razorpay_payment_id   text,
  paid_at               timestamptz,
  created_at            timestamptz default now()
);

-- Order line items — every field is a snapshot at time of order
-- Never recalculate from catalog; store what was actually ordered
create table if not exists order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid references orders(id) on delete cascade,
  product_slug  text not null,
  product_name  text not null,
  color         text,
  size          text not null,
  quantity      int not null check (quantity > 0),
  unit_price    numeric not null
);

-- Enable RLS on all tables
alter table registrations enable row level security;
alter table users enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- RBAC: role column added after initial schema. Run this on existing DBs too.
-- Values: 'user' (default) | 'admin'
alter table users add column if not exists role text not null default 'user';

-- Rule-based checkout shipping (src/lib/shipping.ts). Run on existing DBs
-- BEFORE deploying the code that writes these columns.
-- shipping_fee is in rupees, like total_amount (which already includes it).
alter table orders add column if not exists shipping_fee numeric not null default 0;
alter table orders add column if not exists shipping_rule_version text;

-- Performance indexes for common query patterns
create index if not exists idx_orders_user_id           on orders(user_id);
create index if not exists idx_orders_razorpay_order_id on orders(razorpay_order_id);
create index if not exists idx_order_items_order_id     on order_items(order_id);
