-- Farms table contract used by src/app/page.tsx and src/lib/farms-mapper.ts

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'farm_status') then
    create type public.farm_status as enum ('active', 'inactive');
  end if;
end
$$;

create table if not exists public.farms (
  id text primary key,
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  distance_km double precision not null default 0,
  rating double precision not null default 0,
  review_count integer not null default 0,
  open_now boolean not null default false,
  status public.farm_status not null default 'active',
  categories text[] not null default '{}',
  products text[] not null default '{}',
  hours text not null default '',
  image text not null default '/placeholder.svg',
  bio boolean not null default false,
  features jsonb not null default '{"shop": true, "parking": false, "restaurant": false, "playground": false}'::jsonb,
  seasonal text[] not null default '{}',
  description text not null default '',
  reviews jsonb not null default '[]'::jsonb,
  attraction_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint farms_rating_range check (rating >= 0 and rating <= 5),
  constraint farms_review_count_non_negative check (review_count >= 0),
  constraint farms_features_is_object check (jsonb_typeof(features) = 'object'),
  constraint farms_reviews_is_array check (jsonb_typeof(reviews) = 'array')
);

create index if not exists farms_status_idx on public.farms (status);
create index if not exists farms_categories_gin_idx on public.farms using gin (categories);
create index if not exists farms_products_gin_idx on public.farms using gin (products);
create index if not exists farms_attraction_ids_gin_idx on public.farms using gin (attraction_ids);

create or replace function public.set_farms_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_farms_updated_at on public.farms;
create trigger set_farms_updated_at
before update on public.farms
for each row
execute function public.set_farms_updated_at();
