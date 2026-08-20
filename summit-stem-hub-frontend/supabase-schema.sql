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

create table if not exists public.leadership_events (
  id bigint generated always as identity primary key,
  event_name text not null,
  event_date timestamptz not null,
  location text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.leadership_announcements (
  id bigint generated always as identity primary key,
  title text not null,
  body text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_gpa_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.project_applications enable row level security;
alter table public.leadership_events enable row level security;
alter table public.leadership_announcements enable row level security;
alter table public.user_gpa_profiles enable row level security;

-- Helper functions to avoid RLS policy recursion on profiles.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
  limit 1
$$;

create or replace function public.is_current_user_leader()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'leader', false)
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_current_user_leader() to authenticated;

-- PROFILES POLICIES
drop policy if exists "profiles_select_own_or_leader" on public.profiles;
create policy "profiles_select_own_or_leader"
on public.profiles
for select
using (
  auth.uid() = id
  or public.is_current_user_leader()
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
  or public.is_current_user_leader()
)
with check (
  (
    auth.uid() = id
    and role = public.current_user_role()
  )
  or public.is_current_user_leader()
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
  or public.is_current_user_leader()
);

drop policy if exists "applications_update_leader_only" on public.project_applications;
create policy "applications_update_leader_only"
on public.project_applications
for update
using (
  public.is_current_user_leader()
)
with check (
  public.is_current_user_leader()
);

-- LEADERSHIP EVENTS POLICIES
drop policy if exists "leadership_events_leader_read" on public.leadership_events;
create policy "leadership_events_leader_read"
on public.leadership_events
for select
using (
  public.is_current_user_leader()
);

drop policy if exists "leadership_events_leader_insert" on public.leadership_events;
create policy "leadership_events_leader_insert"
on public.leadership_events
for insert
with check (
  public.is_current_user_leader()
);

drop policy if exists "leadership_events_leader_update" on public.leadership_events;
create policy "leadership_events_leader_update"
on public.leadership_events
for update
using (
  public.is_current_user_leader()
)
with check (
  public.is_current_user_leader()
);

-- LEADERSHIP ANNOUNCEMENT POLICIES
drop policy if exists "leadership_announcements_leader_read" on public.leadership_announcements;
create policy "leadership_announcements_leader_read"
on public.leadership_announcements
for select
using (
  public.is_current_user_leader()
);

drop policy if exists "leadership_announcements_leader_insert" on public.leadership_announcements;
create policy "leadership_announcements_leader_insert"
on public.leadership_announcements
for insert
with check (
  public.is_current_user_leader()
);

drop policy if exists "leadership_announcements_leader_update" on public.leadership_announcements;
create policy "leadership_announcements_leader_update"
on public.leadership_announcements
for update
using (
  public.is_current_user_leader()
)
with check (
  public.is_current_user_leader()
);

-- GPA PROFILE POLICIES
drop policy if exists "user_gpa_profiles_select_own" on public.user_gpa_profiles;
create policy "user_gpa_profiles_select_own"
on public.user_gpa_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "user_gpa_profiles_insert_own" on public.user_gpa_profiles;
create policy "user_gpa_profiles_insert_own"
on public.user_gpa_profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "user_gpa_profiles_update_own" on public.user_gpa_profiles;
create policy "user_gpa_profiles_update_own"
on public.user_gpa_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Optional: set approved leaders after they sign up.
-- update public.profiles set role = 'leader' where full_name in ('Manny', 'Ferranmi');
