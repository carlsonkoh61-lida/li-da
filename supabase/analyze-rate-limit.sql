-- Li-Da · per-user hourly rate limit for /api/analyze  (Phase 0 priority #4, step 2 of 2)
--
-- Step 1 (analyze_cache) made repeat reads cheap by sharing them for 15 min.
-- Step 2 caps how many EXPENSIVE fresh reads a single user can run per hour, so
-- one account can't run up the Anthropic / Finnhub bill. Cache hits are free and
-- are never counted — only fresh reads that actually run.
--
-- Two tables, both locked down exactly like analyze_cache: RLS enabled with NO
-- policies, so only the server (Vercel functions, using the SERVICE key, which
-- bypasses RLS) can read or write them. The browser can never touch these.
--
-- To apply: paste this whole file into the Supabase dashboard → SQL Editor → Run.

-- One row per (user, clock-hour). The server reads the count before a fresh read
-- and bumps it after a successful one. window_start is the start of the current
-- clock hour in UTC — i.e. date_trunc('hour', now()) — written by the server.
create table if not exists public.analyze_usage (
  user_id      uuid        not null,
  window_start timestamptz not null,
  count        int         not null default 0,
  primary key (user_id, window_start)
);

alter table public.analyze_usage enable row level security;

-- Tier lookup. A user with no row here is treated as 'free' by the server, so we
-- DON'T need a row per user — the table only exists to RAISE someone's cap later
-- (set tier = 'paid'). The actual caps (free = 25/hr, paid = 200/hr) live in code
-- (api/analyze.js), so they can be tuned without a migration. This is not billing.
create table if not exists public.user_tier (
  user_id uuid primary key,
  tier    text not null default 'free'
);

alter table public.user_tier enable row level security;
