-- Free Zone: reviews are fully open for anonymous website users.
-- Keep user_id nullable for Android compatibility; web inserts user_id = null.

alter table public.reviews
  alter column user_id drop not null;

grant select on table public.reviews to anon, authenticated;
grant insert on table public.reviews to anon, authenticated;

drop policy if exists "reviews_insert_authenticated_self" on public.reviews;
drop policy if exists "reviews_insert_free_zone" on public.reviews;

create policy "reviews_insert_free_zone"
on public.reviews
for insert
to anon, authenticated
with check (
  user_id is null
  and length(trim(author_name)) > 0
  and length(trim("text")) > 0
  and rating >= 1 and rating <= 5
);
