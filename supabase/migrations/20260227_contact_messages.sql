-- Contact messages table for the /contact page form submissions
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  category text not null default 'general',
  subject text not null,
  message text not null,
  status text not null default 'unread' check (status in ('unread', 'read')),
  created_at timestamptz not null default now()
);

-- Only admins can read/update/delete contact messages
alter table public.contact_messages enable row level security;

create policy "Admins can manage contact messages"
  on public.contact_messages
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Anyone can insert (submit the contact form)
create policy "Anyone can submit contact form"
  on public.contact_messages
  for insert
  with check (true);
