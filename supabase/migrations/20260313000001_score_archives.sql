-- Migration: score_archives table
-- Stores archived score data when a tutor/admin resets scores

create table if not exists score_archives (
  id             uuid default gen_random_uuid() primary key,
  archived_at    timestamptz default now() not null,
  archived_by    uuid references profiles(id) on delete set null,
  archived_by_name text,
  user_id        uuid references profiles(id) on delete set null,
  user_name      text,
  score_type     text not null check (score_type in ('quiz', 'arena', 'all')),
  quiz_id        uuid,
  quiz_title     text,
  session_id     uuid,
  original_score numeric,
  metadata       jsonb default '{}'::jsonb
);

-- Index for efficient lookups
create index if not exists score_archives_user_id_idx on score_archives(user_id);
create index if not exists score_archives_archived_by_idx on score_archives(archived_by);
create index if not exists score_archives_archived_at_idx on score_archives(archived_at desc);
create index if not exists score_archives_score_type_idx on score_archives(score_type);

-- RLS: admins and tutors can read/write; students cannot access
alter table score_archives enable row level security;

create policy "Admins and tutors can view archives"
  on score_archives for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'tutor')
    )
  );

create policy "Admins and tutors can insert archives"
  on score_archives for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'tutor')
    )
  );
