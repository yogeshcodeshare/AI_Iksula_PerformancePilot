-- Phase A follow-up: fixes from the Supabase security/performance advisors.

-- [0011 function_search_path_mutable] pin search_path on the helper.
create or replace function public.is_iksula_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.role() = 'authenticated'
         and lower(auth.jwt() ->> 'email') like '%@iksula.com', false);
$$;

-- Trigger function: empty search_path (all references are schema-qualified).
create or replace function public.audit_failures_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
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

-- [0028/0029 security_definer_function_executable] the trigger function must not
-- be callable via /rest/v1/rpc. Triggers still fire (EXECUTE is checked only at
-- CREATE TRIGGER time).
revoke execute on function public.audit_failures_before_insert() from public, anon, authenticated;

-- Rate-limit lookup in the trigger runs on every guest insert.
create index if not exists audit_failures_guest_session_created_at_idx
  on public.audit_failures (guest_session, created_at)
  where guest_session is not null;

-- Evaluate the helper once per statement instead of once per row.
drop policy if exists "iksula users can read failures" on public.audit_failures;
create policy "iksula users can read failures"
  on public.audit_failures for select
  to authenticated
  using ((select public.is_iksula_user()));

-- Append-only for clients: RLS already blocks update/delete; drop the grants too.
revoke update, delete, truncate on public.audit_failures from anon, authenticated;
