-- Countries
create table countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  region text,
  capital text,
  flag_emoji text,
  languages jsonb,
  currency text,
  population bigint,
  cultural_summary text,
  best_seasons jsonb,
  visa_info text,
  coordinates jsonb,
  created_at timestamptz default now()
);

-- Cities
create table cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_id uuid references countries(id),
  country_code text,
  latitude numeric,
  longitude numeric,
  population bigint,
  description text,
  travel_types jsonb,
  best_for jsonb,
  safety_rating numeric,
  created_at timestamptz default now()
);

-- Cuisines
create table cuisines (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references countries(id),
  country_code text,
  summary text,
  signature_dishes jsonb,
  dietary_options jsonb,
  spice_level int,
  street_food_score int,
  fine_dining_score int,
  created_at timestamptz default now()
);

-- Attractions
create table attractions (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references cities(id),
  name text not null,
  type text,
  description text,
  latitude numeric,
  longitude numeric,
  unesco_site boolean default false,
  popularity_score numeric,
  created_at timestamptz default now()
);

-- AI Response Cache
create table suggestion_cache (
  id uuid primary key default gen_random_uuid(),
  preferences_hash text unique,
  suggestions jsonb,
  created_at timestamptz default now()
);
