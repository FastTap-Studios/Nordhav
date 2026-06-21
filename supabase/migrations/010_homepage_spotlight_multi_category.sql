-- Allow multiple product categories per homepage spotlight card
alter table public.homepage_spotlights
  add column if not exists category_names text[];

update public.homepage_spotlights
set category_names = array[category_name]
where category_names is null
  and category_name is not null
  and category_name <> '';

update public.homepage_spotlights
set category_names = '{}'::text[]
where category_names is null;

alter table public.homepage_spotlights
  alter column category_names set default '{}'::text[],
  alter column category_names set not null;

alter table public.homepage_spotlights
  drop column if exists category_name;
