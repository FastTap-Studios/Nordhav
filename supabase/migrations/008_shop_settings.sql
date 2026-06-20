-- Global shop settings (AI tone, etc.)
create table if not exists public.shop_settings (
  id text primary key default 'default',
  ai_description_theme text not null default 'fishing'
    check (ai_description_theme in ('fishing', 'generic', 'custom')),
  ai_description_custom_prompt text,
  updated_at timestamptz not null default now()
);

comment on table public.shop_settings is 'Singleton shop configuration; id is always default';

insert into public.shop_settings (id, ai_description_theme)
values ('default', 'fishing')
on conflict (id) do nothing;

alter table public.shop_settings enable row level security;

create policy "shop_settings public read"
  on public.shop_settings for select
  using (true);

create policy "shop_settings admin insert"
  on public.shop_settings for insert
  with check (public.is_admin());

create policy "shop_settings admin update"
  on public.shop_settings for update
  using (public.is_admin());
