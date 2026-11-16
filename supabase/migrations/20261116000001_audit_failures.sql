-- Phase A: central error log for every user (guest and Iksula QA).
-- See architecture/database-sop.md and decisions.md [D005].

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helper: is the caller a logged-in Iksula team member?
-- ---------------------------------------------------------------------------
create or replace function public.is_iksula_user()
returns boolean
language sql
stable
as $$
  select coalesce(auth.role() = 'authenticated'
         and lower(auth.jwt() ->> 'email') like '%@iksula.com', false);
$$;

-- ---------------------------------------------------------------------------
-- audit_failures
-- ---------------------------------------------------------------------------
create table if not exists public.audit_failures (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  run_id         uuid not null,
  url            text not null check (char_length(url) between 8 and 2048 and url ~* '^https?://'),
  device         text not null check (device in ('mobile', 'desktop')),
  error_code     text not null check (error_code in (
                   'timeout', 'rate-limit', 'api-error', 'network', 'no-data',
                   'referer-blocked', 'permission-denied', 'quota-exhausted',
                   'preflight-failed', 'page-unreachable', 'psi-page-error')),
  message        text not null default '' check (char_length(message) <= 1000),
  phase          text not null default 'run' check (phase in ('run', 'retry')),
  app_version    text not null default '' check (char_length(app_version) <= 32),
  guest_session  text check (guest_session is null or char_length(guest_session) between 8 and 64),
  -- filled by the trigger below from the JWT; never trusted from the client
  user_id        uuid,
  user_email     text
);

create index if not exists audit_failures_created_at_idx on public.audit_failures (created_at desc);
create index if not exists audit_failures_url_idx on public.audit_failures (url);
create index if not exists audit_failures_error_code_idx on public.audit_failures (error_code);

-- Stamp identity from the token and rate-limit guests (60 rows / session / hour).
create or replace function public.audit_failures_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  if auth.role() = 'authenticated' then
    new.user_id := auth.uid();
    new.user_email := lower(auth.jwt() ->> 'email');
    new.guest_session := null;
  else
    new.user_id := null;
    new.user_email := null;
    if new.guest_session is null then
      raise exception 'guest_session required for anonymous inserts';
    end if;
    select count(*) into recent
      from public.audit_failures
     where guest_session = new.guest_session
       and created_at > now() - interval '1 hour';
    if recent >= 60 then
      raise exception 'rate limit exceeded for this session';
    end if;
  end if;
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists audit_failures_before_insert on public.audit_failures;
create trigger audit_failures_before_insert
  before insert on public.audit_failures
  for each row execute function public.audit_failures_before_insert();

-- Row Level Security: everyone may add, only Iksula users may read.
alter table public.audit_failures enable row level security;

drop policy if exists "anyone can log a failure" on public.audit_failures;
create policy "anyone can log a failure"
  on public.audit_failures for insert
  to anon, authenticated
  with check (true);

drop policy if exists "iksula users can read failures" on public.audit_failures;
create policy "iksula users can read failures"
  on public.audit_failures for select
  to authenticated
  using (public.is_iksula_user());

-- No update/delete policies: rows are append-only for clients.

-- ---------------------------------------------------------------------------
-- Retention: delete rows older than 90 days, daily at 02:00 UTC.
-- pg_cron is available on Supabase (enable under Database -> Extensions).
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron;
select cron.unschedule('purge-old-audit-failures')
  where exists (select 1 from cron.job where jobname = 'purge-old-audit-failures');
select cron.schedule(
  'purge-old-audit-failures',
  '0 2 * * *',
  $$delete from public.audit_failures where created_at < now() - interval '90 days'$$
);
