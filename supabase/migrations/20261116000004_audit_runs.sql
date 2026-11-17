-- Phase C: saved audit runs for logged-in Iksula QA (team history + compare from list).
-- See architecture/database-sop.md "Saved runs (Phase C)".

create table if not exists public.audit_runs (
  id                uuid primary key,                       -- the app's runId
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid not null,                          -- set by trigger
  created_by_email  text not null,                          -- set by trigger
  project_name      text not null check (char_length(project_name) between 1 and 200),
  audit_label       text not null default '' check (char_length(audit_label) <= 200),
  environment       text not null default '' check (char_length(environment) <= 50),
  deployment_tag    text not null default '' check (char_length(deployment_tag) <= 100),
  run_generated_at  timestamptz,
  page_count        int not null default 0 check (page_count between 0 and 500),
  metric_count      int not null default 0 check (metric_count >= 0),
  failure_count     int not null default 0 check (failure_count >= 0),
  overall_health    int check (overall_health between 0 and 100),
  page_urls         text[] not null default '{}',
  report            jsonb not null check (pg_column_size(report) <= 2 * 1024 * 1024)
);

create index if not exists audit_runs_created_at_idx on public.audit_runs (created_at desc);
create index if not exists audit_runs_created_by_idx on public.audit_runs (created_by, created_at desc);
create index if not exists audit_runs_project_idx on public.audit_runs (lower(project_name));

-- Owner identity always comes from the login token.
create or replace function public.audit_runs_stamp_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_by_email := lower(auth.jwt() ->> 'email');
    new.created_at := now();
  else
    -- ownership can never change on update
    new.created_by := old.created_by;
    new.created_by_email := old.created_by_email;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.audit_runs_stamp_owner() from public, anon, authenticated;

drop trigger if exists audit_runs_stamp_owner on public.audit_runs;
create trigger audit_runs_stamp_owner
  before insert or update on public.audit_runs
  for each row execute function public.audit_runs_stamp_owner();

-- Row Level Security
alter table public.audit_runs enable row level security;

drop policy if exists "team can read runs" on public.audit_runs;
create policy "team can read runs"
  on public.audit_runs for select
  to authenticated
  using ((select public.is_iksula_user()));

drop policy if exists "team can save own runs" on public.audit_runs;
create policy "team can save own runs"
  on public.audit_runs for insert
  to authenticated
  with check ((select public.is_iksula_user()));

drop policy if exists "owner can update own runs" on public.audit_runs;
create policy "owner can update own runs"
  on public.audit_runs for update
  to authenticated
  using (created_by = (select auth.uid()) and (select public.is_iksula_user()))
  with check (created_by = (select auth.uid()));

drop policy if exists "owner can delete own runs" on public.audit_runs;
create policy "owner can delete own runs"
  on public.audit_runs for delete
  to authenticated
  using (created_by = (select auth.uid()));

-- Guests get nothing; signed-in users only what the policies allow.
revoke all on public.audit_runs from anon;
grant select, insert, update, delete on public.audit_runs to authenticated;
revoke truncate on public.audit_runs from authenticated;
