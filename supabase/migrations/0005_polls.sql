-- Group voting on a shortlist of destinations. Anyone with a poll's link can
-- see it and vote; all access goes through the server routes (service role),
-- so RLS is on with no policies.

create table if not exists public.polls (
  id          text        primary key,
  title       text        not null,
  options     jsonb       not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.poll_votes (
  poll_id     text        not null references public.polls (id) on delete cascade,
  voter_id    text        not null,
  voter_name  text        not null,
  choices     jsonb       not null,
  updated_at  timestamptz not null default now(),
  primary key (poll_id, voter_id)
);

alter table public.polls enable row level security;
alter table public.poll_votes enable row level security;
