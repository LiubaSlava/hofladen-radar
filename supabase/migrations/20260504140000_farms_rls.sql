-- Row Level Security for public.farms
-- - anon + authenticated: SELECT active farms, OR all farms if JWT app_metadata has "hofladen_admin": true
-- - authenticated only: INSERT/UPDATE/DELETE when admin flag is true
-- Supabase service_role bypasses RLS (no policy needed).

alter table public.farms enable row level security;

revoke all on table public.farms from public;

grant select on table public.farms to anon, authenticated;
grant insert, update, delete on table public.farms to authenticated;

drop policy if exists "farms_select_public_or_admin" on public.farms;
drop policy if exists "farms_write_admin" on public.farms;
drop policy if exists "farms_update_admin" on public.farms;
drop policy if exists "farms_delete_admin" on public.farms;

create policy "farms_select_public_or_admin"
on public.farms
for select
to anon, authenticated
using (
  status = 'active'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'hofladen_admin')::boolean, false)
);

create policy "farms_write_admin"
on public.farms
for insert
to authenticated
with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'hofladen_admin')::boolean, false));

create policy "farms_update_admin"
on public.farms
for update
to authenticated
using (coalesce((auth.jwt() -> 'app_metadata' ->> 'hofladen_admin')::boolean, false))
with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'hofladen_admin')::boolean, false));

create policy "farms_delete_admin"
on public.farms
for delete
to authenticated
using (coalesce((auth.jwt() -> 'app_metadata' ->> 'hofladen_admin')::boolean, false));
