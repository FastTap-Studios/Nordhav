-- Fix product image paths: /src/assets/images/ only works in Vite dev, not in production.
update public.products
set image_url = replace(image_url, '/src/assets/images/', '/images/')
where image_url like '/src/assets/images/%';

update public.products
set image_urls = replace(image_urls::text, '/src/assets/images/', '/images/')::jsonb
where image_urls::text like '%/src/assets/images/%';
