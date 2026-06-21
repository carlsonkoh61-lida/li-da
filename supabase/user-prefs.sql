-- Li-Da · per-user UI preferences
--
-- Stores small per-user UI flags. Today it holds one: whether the user has seen
-- the one-time "tap any underlined term to learn what it means" glossary hint.
--
-- Unlike the service-only tables (analyze_cache, analyze_usage, user_tier), this
-- row is read and written by the BROWSER as the signed-in user, so RLS has
-- policies that let each user touch ONLY their own row. The "seen" flag lives
-- here (not in browser localStorage, which isn't reliable across this app).
--
-- To apply: paste this whole file into the Supabase dashboard → SQL Editor → Run.

create table if not exists public.user_prefs (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  glossary_hint_seen boolean not null default false,
  updated_at         timestamptz not null default now()
);

alter table public.user_prefs enable row level security;

-- Each signed-in user may read and write only their own row.
create policy "user_prefs_select_own" on public.user_prefs
  for select using (auth.uid() = user_id);
create policy "user_prefs_insert_own" on public.user_prefs
  for insert with check (auth.uid() = user_id);
create policy "user_prefs_update_own" on public.user_prefs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
