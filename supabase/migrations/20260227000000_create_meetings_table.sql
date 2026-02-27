-- Create meetings table for tutor-scheduled sessions (Google Meet / Zoom / Teams)
create table if not exists public.meetings (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  title           text not null,
  platform        text not null default 'Google Meet',
  meeting_link    text not null,
  start_time      timestamptz not null,
  created_at      timestamptz not null default now()
);

-- Add created_by safely whether the table is brand-new or already existed
alter table public.meetings
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Indexes for common query patterns
create index if not exists meetings_org_start_idx
  on public.meetings (organization_id, start_time);

create index if not exists meetings_created_by_idx
  on public.meetings (created_by);

-- RLS
alter table public.meetings enable row level security;

-- Drop policies first so this script is safe to re-run
drop policy if exists "org members can view meetings"  on public.meetings;
drop policy if exists "tutors can insert meetings"     on public.meetings;
drop policy if exists "creator can delete meetings"    on public.meetings;

-- Members of the same organisation can read meetings
create policy "org members can view meetings"
  on public.meetings for select
  using (
    organization_id in (
      select organization_id from public.profiles
      where id = auth.uid()
    )
  );

-- Only tutors / admins in the organisation can insert
create policy "tutors can insert meetings"
  on public.meetings for insert
  with check (
    organization_id in (
      select organization_id from public.profiles
      where id = auth.uid()
        and role in ('tutor', 'admin')
    )
    and created_by = auth.uid()
  );

-- Only the creator (or admin) can delete
create policy "creator can delete meetings"
  on public.meetings for delete
  using (created_by = auth.uid());
