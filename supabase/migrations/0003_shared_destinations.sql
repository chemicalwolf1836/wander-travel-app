-- Destinations people have opened, keyed by a normalised city name, so that a
-- /destination/<city> link works on any device (the page data used to live
-- only in the opener's sessionStorage). Written and read only through the
-- server routes with the service-role key.

create table if not exists public.shared_destinations (
  slug        text        primary key,
  data        jsonb       not null,
  created_at  timestamptz not null default now()
);

alter table public.shared_destinations enable row level security;
