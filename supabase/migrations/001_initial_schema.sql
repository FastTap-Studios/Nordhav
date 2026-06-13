-- Nordhav e-commerce schema for Supabase
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/torqcelofqtpfdvktdua/sql

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (linked to auth.users) – must exist before is_admin()
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Admin check helper (add emails here or use profiles.is_admin)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    auth.jwt() ->> 'email' = any(array['chia.jamal93@gmail.com'])
  );
$$;

alter table public.profiles enable row level security;

create policy "profiles read own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email = any(array['chia.jamal93@gmail.com'])
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(12,2) not null default 0,
  image_url text not null default '',
  image_urls jsonb default '[]'::jsonb,
  stock integer not null default 0,
  category text not null default 'Beten',
  created_at timestamptz not null default now(),
  name_en text,
  name_no text,
  description_en text,
  description_no text,
  compare_at_price numeric(12,2),
  sku text,
  weight_grams integer,
  length_mm integer,
  vat_rate numeric(5,2),
  depth_range text,
  color text,
  species_target jsonb default '[]'::jsonb,
  tags jsonb default '[]'::jsonb,
  is_active boolean not null default true,
  is_featured boolean not null default false
);

alter table public.products enable row level security;

create policy "products public read" on public.products
  for select using (true);

create policy "products admin insert" on public.products
  for insert with check (public.is_admin());

create policy "products admin update" on public.products
  for update using (public.is_admin());

create policy "products admin delete" on public.products
  for delete using (public.is_admin());

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default '',
  email text not null,
  customer_name text,
  customer_phone text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2),
  total_amount numeric(12,2) not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  shipping_address jsonb not null default '{}'::jsonb,
  vat_amount numeric(12,2) not null default 0,
  shipping_cost numeric(12,2) not null default 0,
  discount_amount numeric(12,2) default 0,
  discount_code text,
  tracking_number text,
  payment_status text
);

alter table public.orders enable row level security;

create policy "orders public insert" on public.orders
  for insert with check (true);

create policy "orders admin read" on public.orders
  for select using (public.is_admin() or auth.uid()::text = user_id);

create policy "orders admin update" on public.orders
  for update using (public.is_admin());

-- Returns
create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  order_id text not null default '',
  order_number text not null,
  customer_name text not null default '',
  customer_email text not null default '',
  reason text not null default 'other',
  reason_details text,
  status text not null default 'pending',
  refund_amount numeric(12,2) not null default 0,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.returns enable row level security;

create policy "returns admin all" on public.returns
  for all using (public.is_admin())
  with check (public.is_admin());

-- Discount codes
create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null default 'percent',
  value numeric(12,2) not null default 0,
  min_order_amount numeric(12,2) not null default 0,
  max_uses integer not null default 0,
  used_count integer not null default 0,
  is_active boolean not null default true,
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now()
);

alter table public.discount_codes enable row level security;

create policy "discounts public read active" on public.discount_codes
  for select using (is_active = true or public.is_admin());

create policy "discounts admin write" on public.discount_codes
  for insert with check (public.is_admin());

create policy "discounts admin update" on public.discount_codes
  for update using (public.is_admin());

create policy "discounts admin delete" on public.discount_codes
  for delete using (public.is_admin());

-- Seed products (only if empty)
insert into public.products (name, description, price, image_url, image_urls, stock, category, is_active, is_featured)
select * from (values
  ('Nordhav Hydro-Glide Jerkbait', 'Ett tredelat, sjunkande jerkbait med naturtrogen gång.', 249, '/images/nordhav_jerkbait_1781308554224.jpg', '["/images/nordhav_jerkbait_1781308554224.jpg"]'::jsonb, 18, 'Beten', true, true),
  ('Havsöring Special Inline-Spinnare', 'Specialdesignat skeddrag för havsöring längs kusten.', 149, '/images/nordhav_spinner_1781308605971.jpg', '["/images/nordhav_spinner_1781308605971.jpg"]'::jsonb, 25, 'Beten', true, false),
  ('Pro Series Carbon Rod', 'Ultralätt kolfiberspö för maximal känsla och precision.', 1899, '/images/nordhav_rod_1781308568767.jpg', '["/images/nordhav_rod_1781308568767.jpg"]'::jsonb, 8, 'Spön', true, false),
  ('Stealth Reel 3000', 'Mjuk silkeslen gång med patenterad kolfiber-hybridbroms.', 1450, '/images/nordhav_reel_1781308580470.jpg', '["/images/nordhav_reel_1781308580470.jpg"]'::jsonb, 12, 'Rullar', true, false),
  ('Storm-Tech Skaljacka v2', 'Vattentät 3-lagers skaljacka med 20 000 mm vattenpelare.', 3299, '/images/nordhav_jacket_1781308592116.jpg', '["/images/nordhav_jacket_1781308592116.jpg"]'::jsonb, 10, 'Fiskekläder', true, false),
  ('Nordhav Pro Coast Waders', 'Ventilerande andasvadare i absolut toppskikt.', 3899, '/images/nordhav_waders_1781308619366.jpg', '["/images/nordhav_waders_1781308619366.jpg"]'::jsonb, 6, 'Fiskekläder', true, false),
  ('Nordhav Tactical Betesbox', 'Vattentät betesask i hårdplast med kraftiga snäpplås.', 349, '/images/nordhav_tacklebox_1781308631491.jpg', '["/images/nordhav_tacklebox_1781308631491.jpg"]'::jsonb, 15, 'Tillbehör', true, false),
  ('Gentle Catch Flytnätshåv', 'Ultralätt flytande kolfiberhåv med skonsamt nät.', 799, '/images/nordhav_net_1781308643420.jpg', '["/images/nordhav_net_1781308643420.jpg"]'::jsonb, 8, 'Tillbehör', true, false)
) as v(name, description, price, image_url, image_urls, stock, category, is_active, is_featured)
where not exists (select 1 from public.products limit 1);

-- Seed discount codes
insert into public.discount_codes (code, type, value, min_order_amount, max_uses, used_count, is_active)
select * from (values
  ('WELCOME10', 'percent', 10, 0, 0, 12, true),
  ('FRIFRAKT', 'free_shipping', 0, 499, 0, 8, true),
  ('SOMMAR50', 'fixed_amount', 50, 299, 100, 23, true)
) as v(code, type, value, min_order_amount, max_uses, used_count, is_active)
where not exists (select 1 from public.discount_codes limit 1);

-- Seed sample returns
insert into public.returns (order_id, order_number, customer_name, customer_email, reason, reason_details, status, refund_amount, items)
select * from (values
  ('demo-order-1', 'NH-DEMO0001', 'Erik Lindström', 'erik@example.com', 'defect', 'Jerkbaitet har spricka i plasten.', 'pending', 249, '[{"productName":"Nordhav Hydro-Glide Jerkbait","quantity":1,"unitPrice":249}]'::jsonb),
  ('demo-order-2', 'NH-DEMO0002', 'Anna Berg', 'anna@example.com', 'regret', null, 'approved', 149, '[{"productName":"Havsöring Special Inline-Spinnare","quantity":1,"unitPrice":149}]'::jsonb)
) as v(order_id, order_number, customer_name, customer_email, reason, reason_details, status, refund_amount, items)
where not exists (select 1 from public.returns limit 1);

-- Auto-decrement stock when order is placed
create or replace function public.handle_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  pid uuid;
  qty integer;
begin
  for item in select * from jsonb_array_elements(new.items)
  loop
    begin
      pid := (item ->> 'id')::uuid;
      qty := coalesce((item ->> 'quantity')::integer, 0);
      if pid is not null and qty > 0 then
        update public.products
        set stock = greatest(0, stock - qty)
        where id = pid;
      end if;
    exception when others then
      null;
    end;
  end loop;
  return new;
end;
$$;

drop trigger if exists on_order_created on public.orders;
create trigger on_order_created
  after insert on public.orders
  for each row execute function public.handle_new_order();
