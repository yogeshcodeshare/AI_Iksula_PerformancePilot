-- Phase D – security hardening (from the Phase D security review, 17 Nov 2026)
--
-- 1. Guests (anon) only need INSERT on audit_failures. RLS already blocked
--    reads; remove the table-level SELECT grant as well (defence in depth).
--    The app inserts with return=minimal, so no SELECT is needed.
-- 2. Global cap on anonymous error logs. The per-session limit (60/hour) can
--    be bypassed by rotating guest_session; this caps ALL guest inserts at
--    600/hour so the table cannot be flooded. QA (authenticated) is not capped.
-- 3. Deleting a saved run also requires an Iksula account (same rule as
--    update), for consistency.
-- 4. ping(): a tiny read-only function the weekly keep-alive job calls
--    (.github/workflows/supabase-keepalive.yml) so a Free-plan project is
--    not paused after 7 idle days. Returns only the server time.
--
-- Safe to run more than once.

-- 1 ─────────────────────────────────────────────────────────────────────────
revoke select, references, trigger on public.audit_failures from anon;
revoke references, trigger on public.audit_failures from authenticated;
revoke references, trigger on public.audit_runs from authenticated;

-- 2 ─────────────────────────────────────────────────────────────────────────
create index if not exists audit_failures_guest_created_at_idx
  on public.audit_failures (created_at)
  where guest_session is not null;

create or replace function public.audit_failures_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent int;
  recent_all int;
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
    select count(*) into recent_all
      from public.audit_failures
     where guest_session is not null
       and created_at > now() - interval '1 hour';
    if recent_all >= 600 then
      raise exception 'guest error log is busy, try later';
    end if;
  end if;
  new.created_at := now();
  return new;
end;
$$;
revoke execute on function public.audit_failures_before_insert() from public, anon, authenticated;

-- 3 ─────────────────────────────────────────────────────────────────────────
drop policy if exists "owner can delete own runs" on public.audit_runs;
create policy "owner can delete own runs"
  on public.audit_runs for delete
  to authenticated
  using (created_by = (select auth.uid()) and (select public.is_iksula_user()));

-- 4 ─────────────────────────────────────────────────────────────────────────
create or replace function public.ping()
returns timestamptz
language sql
stable
set search_path = ''
as $$ select now() $$;
revoke execute on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
