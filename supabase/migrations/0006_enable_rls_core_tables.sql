-- The original tables were created without row level security, which left them
-- readable and writable by anyone holding the anon key. Every read and write
-- goes through the server routes with the service-role key, which bypasses
-- RLS, so enabling it with no policies closes public access without changing
-- the app's behaviour.

alter table public.countries enable row level security;
alter table public.cities enable row level security;
alter table public.cuisines enable row level security;
alter table public.attractions enable row level security;
alter table public.suggestion_cache enable row level security;
