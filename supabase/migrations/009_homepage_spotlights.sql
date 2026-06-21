-- Marketing category cards on the homepage (link to product_categories.name)
create table if not exists public.homepage_spotlights (
  id text primary key,
  label text not null,
  image_url text not null default '',
  category_name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.homepage_spotlights is
  'Homepage category circles; category_name matches products.category / product_categories.name';

insert into public.homepage_spotlights (id, label, image_url, category_name, sort_order, is_active)
values
  ('hp-gaddfiske', 'Gäddfiske', '/images/nordhav_cat_lures_1781309138230.jpg', 'Beten', 0, true),
  ('hp-abborrfiske', 'Abborrfiske', '/images/nordhav_cat_reels_1781309168529.jpg', 'Rullar', 1, true),
  ('hp-kustfiske', 'Kustfiske', '/images/nordhav_tacklebox_1781308631491.jpg', 'Tillbehör', 2, true),
  ('hp-flugfiske', 'Flugfiske', '/images/nordhav_spinner_1781308605971.jpg', 'Beten', 3, true),
  ('hp-klader', 'Kläder', '/images/nordhav_jacket_1781308592116.jpg', 'Fiskekläder', 4, true),
  ('hp-elektronik', 'Elektronik', '/images/nordhav_net_1781308643420.jpg', 'Tillbehör', 5, true)
on conflict (id) do nothing;

alter table public.homepage_spotlights enable row level security;

create policy "homepage_spotlights public read"
  on public.homepage_spotlights for select
  using (true);

create policy "homepage_spotlights admin insert"
  on public.homepage_spotlights for insert
  with check (public.is_admin());

create policy "homepage_spotlights admin update"
  on public.homepage_spotlights for update
  using (public.is_admin());

create policy "homepage_spotlights admin delete"
  on public.homepage_spotlights for delete
  using (public.is_admin());
