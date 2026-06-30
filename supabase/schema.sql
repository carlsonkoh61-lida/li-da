-- Li-Da · canonical schema + RLS for the core user-data tables
-- =============================================================================
-- Verified live against production 25 Jun 2026.
--
-- This file documents the canonical schema + RLS for the three tables that hold
-- a user's own data: research_log (the journal), watchlist, and alerts.
-- If you change a policy in the Supabase dashboard, UPDATE THIS FILE to match.
--
-- This is a COMMITTED RECORD that exists so the security posture is in version
-- control — reviewable, diffable, and restorable as a reference. It is not
-- executed by any build step.
--
-- Recorded as verified live 25 Jun 2026. Not a migration — do not execute against
-- production; Supabase migrations are the path for actual changes.
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
  created_at timestamptz not null default now()
);

-- Uniqueness is enforced by a unique INDEX, not a table constraint — which is
-- why the earlier pg_constraint check returned nothing. Verified live 25 Jun
-- 2026: composite (user_id, symbol), correctly per-user. Two different users can
-- each watch the same ticker; the 23505 the client catches as "already watching"
-- only fires when the SAME user re-adds their own duplicate.
create unique index watchlist_user_symbol_unique on public.watchlist (user_id, symbol);

alter table public.watchlist enable row level security;

-- NOTE: no UPDATE policy by design — watchlist rows are never edited, only
-- added or removed. Without an update policy, UPDATEs are denied (safe).
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


-- =============================================================================
-- feedback — anonymous landing-page feedback captured at the sign-up wall
-- =============================================================================
-- DESIGN — this table is deliberately DIFFERENT from the user-scoped tables above:
--
--   * WRITE-ONLY from the browser. There is an INSERT policy and NOTHING else —
--     no SELECT, UPDATE, or DELETE policy. With RLS enabled, the absence of a
--     policy means the action is DENIED. So no client (anon OR authenticated) can
--     ever read, edit, or delete a feedback row. Only server-side SERVICE_KEY
--     access (the Supabase dashboard) can read it. This stops anyone from
--     harvesting, altering, or wiping other visitors' feedback.
--
--   * ANONYMOUS by design — there is NO user_id column. The card is shown at the
--     landing wall to signed-OUT visitors, so there is no auth.uid() to bind. The
--     INSERT policy is intentionally `with check (true)` and granted to `anon`:
--     anyone may SUBMIT feedback. That openness is acceptable ONLY because the
--     table is write-only (above) — a malicious actor can add noise, never read
--     or exfiltrate. (Contrast the user tables, where insert is locked to
--     `auth.uid() = user_id`; here there is no owner to scope to.)
--
-- Columns are all low-sensitivity: a coarse clarity bucket, an optional free-text
-- note, the symbol just read (context), and a context tag (e.g. 'wall').
-- =============================================================================
create table if not exists public.feedback (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  clarity    text        not null check (clarity in ('clearer', 'same', 'confused')),
  note       text,                 -- optional open answer; nullable
  symbol     text,                 -- the ticker they just read, for context; nullable
  context    text                  -- where it was captured, e.g. 'wall'; nullable
);

alter table public.feedback enable row level security;

-- The ONLY policy: anonymous visitors may INSERT. `with check (true)` is
-- acceptable here ONLY because this is INSERT (anyone may submit feedback) and
-- there is no read/update/delete policy to pair it with.
create policy feedback_anon_insert on public.feedback
  for insert to anon with check (true);

-- DELIBERATELY NO select / update / delete policies. Do not add them. Reading
-- feedback is a server-side / dashboard (service-key) operation only — the
-- service key bypasses RLS and is never shipped to the browser.
