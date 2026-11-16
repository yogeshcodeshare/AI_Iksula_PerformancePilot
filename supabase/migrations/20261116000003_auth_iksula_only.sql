-- Phase B: only @iksula.com accounts may exist (defence in depth on top of
-- "Allow new users to sign up = OFF"). See architecture/database-sop.md.

create or replace function public.enforce_iksula_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null or lower(new.email) not like '%@iksula.com' then
    raise exception 'Only @iksula.com accounts are allowed'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- Not callable via /rest/v1/rpc (same pattern as migration 0002).
revoke execute on function public.enforce_iksula_email() from public, anon, authenticated;

drop trigger if exists enforce_iksula_email on auth.users;
create trigger enforce_iksula_email
  before insert or update of email on auth.users
  for each row execute function public.enforce_iksula_email();
