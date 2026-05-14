-- Public SEO pages: stable URL slug + optional titles and body text for /hof/[slug]

alter table public.farms
  add column if not exists public_slug text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists public_page_text text;

create unique index if not exists farms_public_slug_lower_key
  on public.farms (lower(btrim(public_slug)))
  where public_slug is not null and btrim(public_slug) <> '';

create index if not exists farms_public_slug_lookup_idx
  on public.farms (public_slug)
  where public_slug is not null and btrim(public_slug) <> '';
