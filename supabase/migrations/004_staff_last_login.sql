-- Track last admin login per staff member

alter table public.staff_members
  add column if not exists last_login_at timestamptz;

-- Allow signed-in staff to update their own last login timestamp
drop policy if exists "staff update own last login" on public.staff_members;
create policy "staff update own last login" on public.staff_members
  for update
  using (lower(email) = lower(auth.jwt() ->> 'email'))
  with check (lower(email) = lower(auth.jwt() ->> 'email'));
