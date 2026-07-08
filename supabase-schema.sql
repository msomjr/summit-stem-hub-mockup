-- SUMMIT STEM Hub Supabase schema and policies
-- Run in Supabase SQL editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'student' check (role in ('student', 'leader'))
);

create table if not exists public.project_applications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  school text not null,
  grade_level text not null,
  project_name text not null,
  interest_response text not null,
  current_skills text not null,
  skills_to_learn text not null,
  availability text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Accepted', 'Waitlisted', 'Rejected')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.project_applications enable row level security;

-- PROFILES POLICIES
drop policy if exists "profiles_select_own_or_leader" on public.profiles;
create policy "profiles_select_own_or_leader"
on public.profiles
for select
using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'leader'
  )
);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
with check (
  auth.uid() = id
  and role = 'student'
);

drop policy if exists "profiles_update_self_or_leader" on public.profiles;
create policy "profiles_update_self_or_leader"
on public.profiles
for update
using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'leader'
  )
)
with check (
  (
    auth.uid() = id
    and role = (
      select p.role
      from public.profiles p
      where p.id = auth.uid()
    )
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'leader'
  )
);

-- PROJECT APPLICATION POLICIES
drop policy if exists "applications_insert_own" on public.project_applications;
create policy "applications_insert_own"
on public.project_applications
for insert
with check (auth.uid() = user_id);

drop policy if exists "applications_select_own_or_leader" on public.project_applications;
create policy "applications_select_own_or_leader"
on public.project_applications
for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'leader'
  )
);

drop policy if exists "applications_update_leader_only" on public.project_applications;
create policy "applications_update_leader_only"
on public.project_applications
for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'leader'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'leader'
  )
);

-- Optional: set approved leaders after they sign up.
-- update public.profiles set role = 'leader' where full_name in ('Manny', 'Ferranmi');
