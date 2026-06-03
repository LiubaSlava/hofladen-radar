-- Public user submissions: pending until admin approves (status = active).

do $$
begin
  if exists (select 1 from pg_type where typname = 'farm_status') then
    alter type public.farm_status add value if not exists 'pending';
  end if;
exception
  when duplicate_object then null;
end
$$;

alter table public.farms
  add column if not exists submitter_name text,
  add column if not exists submitter_email text,
  add column if not exists submitted_at timestamptz;

create index if not exists farms_status_pending_idx on public.farms (status)
  where status = 'pending';
