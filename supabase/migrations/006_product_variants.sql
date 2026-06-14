-- Product size/variant options (clothing sizes, rod lengths, reel sizes, etc.)
alter table public.products
  add column if not exists variant_label text,
  add column if not exists variants jsonb not null default '[]'::jsonb;

comment on column public.products.variant_label is 'Display label for variant picker, e.g. Storlek, Längd';
comment on column public.products.variants is 'Array of { id, label, stock, sku? }';
