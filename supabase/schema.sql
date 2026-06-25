-- Li-Da · canonical schema + RLS for the core user-data tables
-- =============================================================================
-- Verified live against production 25 Jun 2026.
--
-- This file documents the canonical schema + RLS for the three tables that hold
-- a user's own data: research_log (the journal), watchlist, and alerts.
-- If you change a policy in the Supabase dashboard, UPDATE THIS FILE to match.
--
-- This is a COMMITTED RECORD, not an auto-run migration. It is not executed by
-- any build step. It exists so the security posture is in version control —
-- reviewable, diffable, and restorable. To restore/reproduce in a fresh project,
-- paste it into Supabase → SQL Editor → Run (the drop-policy-if-exists guards
-- make the policy section safely re-runnable).
--
-- The other tables are documented in their own files:
--   analyze_cache       → supabase/analyze-cache.sql      (service-key only, RLS on / no policies)
--   analyze_usage       → supabase/analyze-rate-limit.sql (service-key only)
--   user_tier           → supabase/analyze-rate-limit.sql (service-key only)
--   anon_read_usage     → supabase/anon-read-usage.sql    (service-key only)
--   user_prefs          → supabase/user-prefs.sql         (per-user, auth.uid() = user_id)
--
-- Ownership model: the browser inserts rows WITHOUT a user id (e.g.
-- insert({ symbol })). Rows are bound to the inserting user by the column
-- default `user_id uuid not null default auth.uid()`, and every policy enforces
-- `auth.uid() = user_id`. Both halves are required — the default binds the row,
-- the policy guards access.
-- =============================================================================


-- =============================================================================
-- research_log — the journal: one row per logged decision
-- NOTE: user_id is currently NULLABLE here (the other two tables are NOT NULL).
--       The own_* policies already enforce ownership, so this is not an open
--       hole; see the PRELAUNCH open item about SET NOT NULL (belt-and-suspenders).
-- =============================================================================
create table if not exists public.research_log (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        default auth.uid() references auth.users(id) on delete cascade,
  symbol        text        not null,
  price_at_log  numeric,
  ai_lean       text,
  ai_confidence text,
  ai_summary    text,
  decision      text,
  entry         numeric,
  stop_loss     numeric,
  take_profit   numeric,
  reasoning     text,
  created_at    timestamptz not null default now()
);

alter table public.research_log enable row level security;

drop policy if exists own_select on public.research_log;
drop policy if exists own_insert on public.research_log;
drop policy if exists own_update on public.research_log;
drop policy if exists own_delete on public.research_log;

create policy own_select on public.research_log
  for select using (auth.uid() = user_id);
create policy own_insert on public.research_log
  for insert with check (auth.uid() = user_id);
create policy own_update on public.research_log
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_delete on public.research_log
  for delete using (auth.uid() = user_id);


-- =============================================================================
-- watchlist — per-user tickers
-- =============================================================================
create table if not exists public.watchlist (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  symbol     text        not null,
  created_at timestamptz not null default now(),
  -- VERIFY LIVE: the client treats a unique-violation (23505) on insert as
  -- "already watching". This constraint MUST be composite (user_id, symbol) so
  -- two different users can each watch the same ticker. If live inspection shows
  -- it is on `symbol` ALONE, that is a bug (user B can't watch a ticker user A
  -- already has, and leaks that someone watches it) — fix to composite.
  unique (user_id, symbol)
);

alter table public.watchlist enable row level security;

-- NOTE: no UPDATE policy by design — watchlist rows are never edited, only
-- added or removed. Without an update policy, UPDATEs are denied (safe).
drop policy if exists wl_select on public.watchlist;
drop policy if exists wl_insert on public.watchlist;
drop policy if exists wl_delete on public.watchlist;

create policy wl_select on public.watchlist
  for select using (auth.uid() = user_id);
create policy wl_insert on public.watchlist
  for insert with check (auth.uid() = user_id);
create policy wl_delete on public.watchlist
  for delete using (auth.uid() = user_id);


-- =============================================================================
-- alerts — per-user price-level alerts (read by the cron via the SERVICE key)
-- =============================================================================
create table if not exists public.alerts (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  symbol          text        not null,
  direction       text        not null check (direction in ('above', 'below')),
  threshold       numeric     not null,
  note            text,
  email           text,
  status          text        not null default 'active' check (status in ('active', 'triggered', 'paused')),
  triggered_at    timestamptz,
  triggered_price numeric,
  created_at      timestamptz not null default now()
);

alter table public.alerts enable row level security;

drop policy if exists al_select on public.alerts;
drop policy if exists al_insert on public.alerts;
drop policy if exists al_update on public.alerts;
drop policy if exists al_delete on public.alerts;

create policy al_select on public.alerts
  for select using (auth.uid() = user_id);
create policy al_insert on public.alerts
  for insert with check (auth.uid() = user_id);
create policy al_update on public.alerts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy al_delete on public.alerts
  for delete using (auth.uid() = user_id);

-- The cron (api/check-alerts.js) reads/writes alerts with the SUPABASE_SERVICE_KEY,
-- which bypasses RLS. That key is server-side only (Vercel env var); it never
-- ships to the browser. The policies above govern the BROWSER (anon/authenticated)
-- paths only.
