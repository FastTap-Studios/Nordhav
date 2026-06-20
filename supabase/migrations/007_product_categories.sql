-- Shop product categories (managed from admin)
create table if not exists public.product_categories (
  id text primary key,
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  show_in_nav boolean not null default true,
  show_in_shop_filter boolean not null default true,
  variant_mode text not null default 'simple'
    check (variant_mode in ('beten', 'clothing', 'rod', 'reel', 'simple', 'none')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.product_categories is 'Configurable shop categories; products.category stores the category name as text';

insert into public.product_categories (id, name, sort_order, is_active, show_in_nav, show_in_shop_filter, variant_mode)
values
  ('cat-beten', 'Beten', 0, true, true, true, 'beten'),
  ('cat-spön', 'Spön', 1, true, true, true, 'rod'),
  ('cat-rullar', 'Rullar', 2, true, true, true, 'reel'),
  ('cat-klader', 'Fiskekläder', 3, true, true, true, 'clothing'),
  ('cat-tillbehor', 'Tillbehör', 4, true, true, true, 'simple')
on conflict (id) do nothing;

alter table public.product_categories enable row level security;

create policy "product_categories public read"
  on public.product_categories for select
  using (true);

create policy "product_categories admin insert"
  on public.product_categories for insert
  with check (public.is_admin());

create policy "product_categories admin update"
  on public.product_categories for update
  using (public.is_admin());

create policy "product_categories admin delete"
  on public.product_categories for delete
  using (public.is_admin());
