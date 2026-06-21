-- Li-Da · anonymous free-read guard (per-IP cap for /api/analyze)
--
-- Anonymous (not-signed-in) visitors get one free taste read on the home page.
-- The browser cookie enforces "1 free read per browser" for honest users; THIS
-- table is the real abuse guard: a strict per-IP cap on fresh reads that protects
-- the Anthropic key from anyone clearing cookies or scripting.
--
-- Privacy: we store only a SHA-256 HASH of the visitor's IP (salted), never the
-- raw IP. One row per (ip_hash, time-window); the server reads the count before a
-- fresh anonymous read and bumps it after one. Cache hits are free and never
-- counted, mirroring the logged-in rule.
--
-- Locked down exactly like analyze_cache / analyze_usage: RLS enabled with NO
-- policies, so only the server (Vercel functions, SERVICE key, which bypasses
-- RLS) can read or write it. The browser can never touch this table.
--
-- Tunable via Vercel env vars (defaults shown): ANON_IP_FREE_READS = 5,
-- ANON_IP_WINDOW_HOURS = 24, ANON_IP_SALT (any random string).
--
-- To apply: paste this whole file into the Supabase dashboard → SQL Editor → Run.

create table if not exists public.anon_read_usage (
  ip_hash      text        not null,
  window_start timestamptz not null,
  count        int         not null default 0,
  primary key (ip_hash, window_start)
);

alter table public.anon_read_usage enable row level security;
