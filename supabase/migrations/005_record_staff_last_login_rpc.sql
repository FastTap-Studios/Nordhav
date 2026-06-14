-- Reliable last-login tracking via security definer RPC (avoids RLS/timing issues)

create or replace function public.record_staff_last_login()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  ts timestamptz := now();
  user_email text := lower(trim(auth.jwt() ->> 'email'));
begin
  if user_email is null or user_email = '' then
    return null;
  end if;

  update public.staff_members
  set last_login_at = ts
  where lower(email) = user_email
    and is_active = true;

  return ts;
end;
$$;

revoke all on function public.record_staff_last_login() from public;
grant execute on function public.record_staff_last_login() to authenticated;
