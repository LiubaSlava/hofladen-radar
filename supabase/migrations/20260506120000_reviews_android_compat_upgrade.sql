-- Апгрейд со старой версии (body, farm_id text, user_id NOT NULL) при необходимости.
-- Выполняется только если таблица уже существовала с колонкой body.

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'reviews'
  ) then
    return;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reviews' and column_name = 'body'
  ) then
    alter table public.reviews drop constraint if exists reviews_body_non_empty;
    alter table public.reviews rename column body to "text";
    alter table public.reviews add constraint reviews_text_non_empty check (length(trim("text")) > 0);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reviews' and column_name = 'user_id' and is_nullable = 'NO'
  ) then
    alter table public.reviews alter column user_id drop not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reviews' and column_name = 'farm_id' and data_type = 'text'
  ) then
    alter table public.reviews
      alter column farm_id type uuid using farm_id::uuid;
  end if;
end
$$;

drop policy if exists "reviews_insert_authenticated_self" on public.reviews;

create policy "reviews_insert_authenticated_self"
on public.reviews
for insert
to authenticated
with check (user_id is not null and auth.uid() = user_id);
