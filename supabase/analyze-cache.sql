-- Li-Da · analyze read cache  (Phase 0 priority #4, step 1 of 2 — caching only)
--
-- A shared cache for the expensive /api/analyze endpoint. One row per symbol;
-- a completed AI read is reused for 15 minutes so that one AAPL read serves
-- EVERY user, instead of firing ~17 Finnhub calls + an Anthropic call on every
-- request. The 15-minute freshness window is enforced in code (api/analyze.js),
-- not in SQL — this table just stores the latest read per symbol.
--
-- A read is market analysis, not personal data, so the cache is intentionally
-- shared across all users.
--
-- Access: read and written ONLY by the server (Vercel functions) using the
-- Supabase SERVICE key, which bypasses RLS. RLS is enabled with NO policies,
-- so the browser (anon / authenticated roles) can never read or write this
-- table — the cache can't be poisoned from the client.
--
-- To apply: paste this whole file into the Supabase dashboard → SQL Editor → Run.

create table if not exists public.analyze_cache (
  symbol      text primary key,          -- uppercase ticker, e.g. "AAPL"
  payload     jsonb not null,            -- the full /api/analyze response object
  created_at  timestamptz not null default now()
);

-- Lock the table down: enable RLS and add no policies, so only the service key
-- (server-side) can touch it.
alter table public.analyze_cache enable row level security;
