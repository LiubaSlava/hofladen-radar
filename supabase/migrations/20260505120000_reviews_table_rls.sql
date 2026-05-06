-- Reviews: farm_id = uuid (совместимость с Android и API).
-- FK на public.farms не задаём: в части окружений farms.id ещё text; после перевода farms.id → uuid можно добавить:
--   alter table public.reviews add constraint reviews_farm_id_fkey foreign key (farm_id) references public.farms (id) on delete cascade;
-- user_id nullable для совместимости с Android; с сайта всегда передаётся auth.uid().
-- Текст отзыва в колонке "text" (зарезервированное имя — в SQL в кавычках).

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null,
  user_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  rating smallint not null,
  "text" text not null,
  created_at timestamptz not null default now(),
  constraint reviews_rating_range check (rating >= 1 and rating <= 5),
  constraint reviews_text_non_empty check (length(trim("text")) > 0)
);

create index if not exists reviews_farm_id_created_at_idx on public.reviews (farm_id, created_at desc);
create index if not exists reviews_user_id_idx on public.reviews (user_id);

alter table public.reviews enable row level security;

revoke all on table public.reviews from public;

grant select on table public.reviews to anon, authenticated;
grant insert on table public.reviews to authenticated;

drop policy if exists "reviews_select_public" on public.reviews;
drop policy if exists "reviews_insert_authenticated_self" on public.reviews;

create policy "reviews_select_public"
on public.reviews
for select
to anon, authenticated
using (true);

-- Вставка только со своим uid (сайт всегда шлёт user_id из сессии).
create policy "reviews_insert_authenticated_self"
on public.reviews
for insert
to authenticated
with check (user_id is not null and auth.uid() = user_id);
