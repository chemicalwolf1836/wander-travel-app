-- Generic cache for AI-generated content (packing lists, itineraries, budgets).
-- Replaces per-serverless-instance in-memory Maps that vanished on every cold
-- start and were never shared across instances. Mirrors how suggestion_cache
-- already backs /api/suggest, but keyed generically by (kind, cache_key).

create table if not exists public.ai_cache (
  kind        text        not null,
  cache_key   text        not null,
  value       jsonb       not null,
  created_at  timestamptz not null default now(),
  primary key (kind, cache_key)
);

-- Reads filter on freshness (created_at >= now() - 24h), so index it.
create index if not exists ai_cache_created_at_idx on public.ai_cache (created_at);

-- Only the server (service-role key) touches this table; the anon/browser key
-- never should. Enable RLS with no policies so anon access is denied by default
-- while the service role continues to bypass RLS.
alter table public.ai_cache enable row level security;
