-- Staff / personnel with admin access

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null default '',
  role text not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by text
);

create unique index if not exists staff_members_email_lower_idx
  on public.staff_members (lower(email));

alter table public.staff_members enable row level security;

create policy "staff admin all" on public.staff_members
  for all using (public.is_admin())
  with check (public.is_admin());

-- Keep profiles.is_admin in sync when staff list changes
create or replace function public.sync_profile_admin_from_staff()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    update public.profiles
    set is_admin = false
    where lower(email) = lower(old.email);
    return old;
  end if;

  update public.profiles
  set is_admin = new.is_active
  where lower(email) = lower(new.email);

  return new;
end;
$$;

drop trigger if exists staff_sync_profile on public.staff_members;
create trigger staff_sync_profile
  after insert or update or delete on public.staff_members
  for each row execute function public.sync_profile_admin_from_staff();

-- Updated admin check: profile flag OR active staff email
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    exists (
      select 1 from public.staff_members s
      where lower(s.email) = lower(auth.jwt() ->> 'email')
        and s.is_active = true
    ),
    false
  );
$$;

-- New users inherit admin if listed in staff_members
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_admin boolean;
begin
  select exists (
    select 1 from public.staff_members s
    where lower(s.email) = lower(new.email) and s.is_active = true
  ) into staff_admin;

  insert into public.profiles (id, email, full_name, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(staff_admin, false)
  )
  on conflict (id) do update set
    email = excluded.email,
    is_admin = excluded.is_admin or public.profiles.is_admin;

  return new;
end;
$$;

-- Admins may update any profile (e.g. toggling access)
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles
  for update using (public.is_admin());

-- Seed owner account
insert into public.staff_members (email, full_name, role, is_active, created_by)
select 'chia.jamal93@gmail.com', 'Chia Jamal', 'admin', true, 'system'
where not exists (
  select 1 from public.staff_members where lower(email) = lower('chia.jamal93@gmail.com')
);

update public.profiles
set is_admin = true
where lower(email) = lower('chia.jamal93@gmail.com');
