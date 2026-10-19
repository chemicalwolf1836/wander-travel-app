-- Per-account copy of the data Wander otherwise keeps in one browser's
-- localStorage (saved places, notes, trip dates, plans, route, settings), so
-- it follows a signed-in user across devices. The browser reads and writes its
-- own row directly with the anon key; RLS limits every user to their row.

create table if not exists public.user_data (
  user_id     uuid        primary key references auth.users (id) on delete cascade,
  data        jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "Users read their own data"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "Users insert their own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

create policy "Users update their own data"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
