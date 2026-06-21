# CLAUDE.md — Li-Da

> Read this first, every session. It's the brief for working on Li-Da. If something here conflicts with a quick assumption, this file wins. When in doubt, ask before changing behavior — don't guess.

---

## What Li-Da is

A **browser-based, anti-hype stock research and decision-support tool** for self-directed retail investors. It pulls market data, gets a structured AI read (bull case, bear case, a buy/sell/hold lean with a confidence level, key price levels), and helps the user set their own exit rules and log their decisions.

**What it is NOT:** not an auto-trader, not a "buy machine," not a signal service, not a financial advisor. It never touches a broker. The user executes trades by hand on Moomoo.

**The mission:** help investors make calmer, more rational, fact-based decisions — and resist hype. Success is a tool people trust *because* it doesn't oversell.

---

## Non-negotiable principles (the guardrails)

These are the soul of the product. Do not violate them even if asked to "just this once" — flag the conflict instead.

1. **Decision-support, never an oracle.** Always show the bear case weighted equally with the bull case. The user owns the decision and the risk.
2. **Confidence is a LEVEL, never a fake percentage.** The read returns low / medium / high. Never render "73%" — that's invented precision. The confidence ring is a **3-segment gauge** (low = 1 lit, medium = 2, high = 3), never a smooth arc that reads like a score.
3. **No confident "buy at X / sell at Y" verdicts.** A lean is one input for the user to weigh, never an instruction or a promise.
4. **Commit when earned, in either direction.** The read should lean buy OR sell when the evidence genuinely supports it, and use *confidence* to express uncertainty — not retreat to "hold" to play safe. But a "buy" lean is a reasoned read, never a nudge to chase.
5. **Deterministic over generative for warnings.** Red flags are computed from objective thresholds in code, never LLM-inferred, to avoid hallucination and keep credibility.
6. **Selling ≠ red flag.** Insider selling is framed as *amber context*, with the explicit caveat that it's "never a copy signal."
7. **Anti-hype is a design constraint.** Reject features that encourage copy-trading, signal-following, or FOMO — even when technically interesting.
8. **Honesty over polish.** If data is missing, stale, or thin, say so. Never fabricate precision or attribution.
9. **Not a financial or legal advisor.** The tool gives reasoning and trade-offs, never advice.

---

## Stack & hard constraints

- **Browser-based, no local install.** (User's corporate IT blocks installs.) All server-side work lives in **Vercel serverless functions** under `/api`.
- **Deploy:** Vercel → `li-da.vercel.app` (custom domain pending — see priorities).
- **DB:** Supabase, **RLS-enabled** on every table. Browser uses the Supabase client for auth-gated reads/writes.
- **Repo:** GitHub private `li-da`.
- **AI:** Anthropic API. **Default the analysis model to Sonnet 4.6**; reserve Opus only for occasional deep dives (cost).
- **Data:** Finnhub (free tier — quotes, fundamentals, profile/logo, peers, insider Form 4, earnings, recommendations, news). **Twelve Data** for chart price history.
- **Email:** Resend. **Scheduler:** cron-job.org.
- **API keys ALWAYS server-side** (Vercel env vars, e.g. `FINNHUB_API_KEY`, the Anthropic key). **Never** put a key in the browser.

---

## File map

**Pages (vanilla HTML/JS, each links `/lida.css`):**
- `research.html` — **the Desk. The flagship.** Search → live quote hero → AI read (confidence ring + bull/bear meter) → metric cards → "Versus peers" (logos/names/market cap) → candlestick chart → "Your move" discipline panel (color-coded exits, R:R chip) → journal logging.
- `watchlist.html` — per-user tickers, live price, last logged lean, tap-through to Desk.
- `alerts.html` — price-level alerts; the create form shows the live price + warns if a level is already crossed.
- `journal.html` — the scorecard: logged decisions scored against outcomes.
- `login.html` — Supabase email/password auth.
- `index.html` — the NOVA voice orb (currently the home page — flagged for reconsideration).
- `lida-tasks.html` — a separate task manager (different light theme; flagged as focus-drift / candidate to cut).
- `nav.js` — the shared top-nav shell injected on every page.
- `lida.css` — **ONE source of truth** for the palette and design tokens.

**Endpoints (`/api`):**
- `market.js` — Finnhub quote + profile (returns price/change, name, **logo**, **industry**).
- `analyze.js` — the AI read. Pulls many Finnhub endpoints + peers (with peer profiles for logos/names + market cap), builds a factPack, calls Sonnet, returns the structured read.
- `chart.js` — Twelve Data price history for the candlestick + hero sparkline.
- `search.js` — name → ticker lookup (powers the Desk autocomplete).
- `check-alerts.js` — cron-triggered; checks alert levels, updates status, sends Resend email. Has cron-secret auth.
- `coach.js` — (verify current role; journal coaching.)

**Supabase tables (RLS):** `research_log` (journal), `watchlist`, `alerts`.

---

## Design system (premium palette — use tokens, never hardcode)

Defined in `lida.css`. Core tokens:
- `--bg #0A0D12`, `--surface #141A24`, `--surface-2`, `--line`
- `--ink #EEF0F5`, `--ink-dim`, `--muted #7A8497`
- `--accent #8FB0D6` (steel-blue), `--accent-dim #B3C8E2`, `--accent-deep #5E7FA8`
- `--up #5FB58C` (muted green), `--down #D9706B` (muted red)
- `--gold` / `--warn #CBB081` (brass — used for "confidence")
- Fonts: **Space Grotesk** (display), **Inter** (body), **IBM Plex Mono** (numbers/mono)

Rules: **No purple anywhere** (legacy palette, fully removed). **No bright neon green/red** — always the muted `--up`/`--down`. Legacy aliases exist (`--violet` → `--accent`, `--panel` → `--surface`, `--amber` → `--warn`) so old inline styles still resolve.

---

## Conventions

- **Surgical edits.** Change one thing at a time; keep all existing logic intact; verify before declaring done. This is ~1000+ lines of wired logic per page — one wrong line silently breaks the chart or the logging.
- The confidence ring, bull/bear meter, color-coded exits, and metric cards are established patterns — match them.
- Prefer **simple, working, browser-based** over clever. Don't over-engineer. Watch cost (flag when something runs up Anthropic/data spend, or when a cheaper model/approach does the job).
- `max_tokens` for the read: rich tickers need ~2800 (1700 truncates).

---

## How to work with Carlson (the builder)

- Non-technical, learns by doing. **One step at a time, plain language, no jargon.** Finish a step, let him get it working (he confirms via screenshot), then move on.
- **Be honest about real vs hype.** If he's overreaching or a past promise was overstated, say so plainly. He'd rather hear "this won't work" than an optimistic maybe.
- Take his **ethical and security worries seriously** — engage, don't wave them away.
- He values the anti-hype mission over feature-count. Evaluate features against it *before* building.

---

## Current priorities (Phase 0 — pre-launch hardening)

From the strategy stress-test, in order:

1. **Custom domain** — resolves the `vercel.app` "Dangerous site" Safe-Browsing warning on credential forms. (User action: buy + point Vercel.)
2. **Name → ticker search** — ✅ DONE (`search.js` + Desk autocomplete).
3. **Data sanity guards** — detect stale/defunct/zero-price tickers (the "MVPS" class — a delisted ETF frozen at a stale price) across the Desk *and* alerts.
4. **Caching + per-user rate-limiting on `/api/analyze`** — the existential one (cost, abuse, scale). One Desk read ≈ ~20 data calls; Finnhub free ≈ 60/min.
5. **Mobile pass** on the Desk.
6. **Legal consult** — MY (Securities Commission Malaysia) review of whether buy/sell leans need licensing. (User action.)
7. **Focus calls** — make the Desk the home page; decide whether `lida-tasks.html` stays in the product.

---

## Known gotchas

- **Finnhub free tier:** thin coverage for small-cap / OTC / foreign / penny / ETF tickers; returns zeros or stale data for delisted names. Rate limit ~60/min — a single Desk read fires ~20 calls (scaling cliff).
- **Twelve Data free tier** has its own daily/minute caps (charts).
- **Resend** silently drops fake test emails — always test with a real inbox.
- **The "Dangerous" browser warning** comes from the shared `vercel.app` domain flagging credential forms — fixed only by a custom domain.
- Three hard external dependencies with no fallback: Finnhub (down → app dead), Twelve Data (charts), Anthropic (reads).

---

## Phase 2 — Personalization & the moat (vision; build AFTER Phase 0 hardening)

> This is Li-Da's north star and its real defensibility. The data (prices, fundamentals) is **rented** — anyone can buy the same feed and call the same model. The moat is **each user's own accumulated history**, owned by Li-Da and impossible for a competitor to clone. A rival who copies the plumbing gets a blank-slate model; Li-Da arrives already knowing the user. Build everything here in service of that.

### The core idea, stated honestly (read this before building anything here)

"Different users have different Li-Da — an assistant that knows *them* and gets sharper the more they use it." This is achievable and is the goal. But the mechanism is **per-user memory, NOT per-user model training**:

- **There is ONE shared base model (Claude via the user's BYOK Anthropic key). Do NOT fine-tune or train a per-user model.** That is out of scope, ruinously expensive, and impossible on this stack. Any task that proposes training/fine-tuning is wrong — stop and flag it.
- What differs per user is the **context injected into the prompt.** Li-Da accumulates the user's history in Supabase, distills it into a compact per-user **behavioral profile** (a few hundred tokens), and injects that profile into the read. Same model, different memory → it behaves like *their* Li-Da.
- The "self-learning" / "gets to know you" quality lives in the **database**, not in model weights. The profile updates each time the user logs a call. The system learns; the model doesn't.
- **Cost rule:** never feed a user's full raw history into a read. Maintain and inject the compact profile only; refresh it on write, not on every read. Re-reading 90 days of calls per request is the bankrupt pattern.

### The three pillars (build in this order)

**Pillar A — "What's making you hesitate?" (the intake valve).**
Before/with a read, ask the user to name their actual doubt (e.g. "it already ran too far," "I'm scared I'm late," "I don't trust the earnings"). The analysis then answers *that specific doubt* with evidence for and against it — caring, personal, not a generic report. Crucially, the user's answer is a **labeled data point** (their fear, on this ticker, at this moment, with the outcome to follow) — so this feature is the primary intake that feeds Pillar B. Build it partly to populate the history.

**Pillar B — History-aware, personalized reads (the moat turning on).**
When a user pulls a read, fetch *their* compact behavioral profile and inject it so the read is tailored to them: e.g. "You've pulled three momentum names near local highs and tend to hold winners too long — here's what's similar and different this time."
- **Mirror behavior, never predict outcomes.** Honest framing is "I've noticed a tendency to…", grounded in *their own* past actions. NEVER "you'll lose on this" or "the data proves you lose X% of the time" — that is the oracle trap and it also misrepresents a tiny sample. Qualitative patterns, stated with humility. A few months of calls is a SMALL sample — say so.
- This is retrieval-augmented personalization over `research_log`, summarized into the profile. It is the single most defensible thing Li-Da builds.

**Pillar C — Proactive "Jarvis" nudges (USP, but the most dangerous to cost).**
Reach out when something a user researched moves (e.g. "a stock you read two weeks ago dropped 8% — want a fresh read?"). Leverages the existing `check-alerts.js` + Resend infra and the history moat. **Hard cost guardrail:**
- The **trigger must be cheap and deterministic** — a price level crossing, computed in code, essentially free. Do NOT run scheduled AI reads across every user × every watched ticker — that auto-burns Finnhub + Anthropic budget and bankrupts the app.
- The **expensive AI re-read fires only when the user CLICKS the notification.** Jarvis taps the shoulder for free; he only does the costly thinking when asked.
- "Real-time" is realistically "periodic check → notification" on a browser-only/email stack. Don't promise users instant push and deliver every-15-minutes.

### Architecture moves this implies

- **Remove the NOVA voice orb as the home page; make the Desk the home** and the central surface (consistent with Phase 0 priority #7). The orb is a v2 drop, not the entry point.
- Evolve the Desk from one-shot tool → a place the user can prompt within. Stage honestly: (1) Desk-as-home + richer logging; (2) profile-injected reads; (3) a conversational "ask Li-Da about your patterns" surface — pillar 3 is a real v2 shift from tool to assistant, not a quick edit.
- New Supabase state (RLS, service-key pattern like `analyze_cache`): a per-user `profile` (the distilled behavioral summary), updated on each logged call.

### Why the boring Phase 0 work is the foundation (not a detour)

The cache and per-user rate limiter being built now are exactly what make per-user personalization and proactive nudges *affordable*. You cannot run a per-user assistant on a stack with no cost controls. Phase 0 lays the rails for Phase 2.

### What this is NOT

Not a predictor, not an oracle, not a per-user trained model, not real-time push, not directional advice on regulated local (Bursa) securities. It is a partner that knows *you* — your patterns, your blind spots, your specific doubt — built on data you own and a competitor can't clone.

---

## System architecture & data flow

Three layers (top → bottom):

1. **Browser — pages** (each loads `lida.css` + `nav.js`): the **Desk** (`research.html`, the core), plus `watchlist`, `alerts`, `journal`, `login`. (`index.html` = the orb, being deprecated as home; `lida-tasks.html` = candidate to cut.)
2. **Vercel · serverless `/api`** (your code; ALL secret keys live here, never in the browser): `market`, `analyze`, `chart`, `search`, `check-alerts`.
3. **External services & storage** (rented / outside): **Finnhub** (quotes, fundamentals, search, profiles), **Twelve Data** (chart price history), **Anthropic** (the AI read, Sonnet), **Supabase** (database + auth), **Resend** (alert emails), **cron-job.org** (scheduler).

**The core flow — "pull a read":**
- Desk → `/api/search` (name → ticker) and `/api/market` (live quote from Finnhub; the stale-data guard runs here).
- Desk → `/api/chart` → Twelve Data (price history for the candlestick + hero sparkline).
- Desk → `/api/analyze`: `verifyUser` (Supabase JWT) → check `analyze_cache` (15-min shared cache) → on a miss, `checkRateLimit` (`analyze_usage` + `user_tier`, 25/hr free) → pull ~17 Finnhub endpoints + call Anthropic → `writeCache` + `recordRead` → return the structured read.
- Desk → logs the user's decision to `research_log` (the journal).

**The alerts flow** (separate entry point, not browser-driven): cron-job.org → `/api/check-alerts` (cron-secret auth) → reads the `alerts` table, checks levels via Finnhub, emails via Resend.

**Supabase tables** (all RLS-enabled; server tables = service-key only, no policies): `analyze_cache`, `analyze_usage`, `user_tier`, `research_log`, `watchlist`, `alerts`.

**Single points of failure** (no fallback): Finnhub (down → app dead), Twelve Data (charts), Anthropic (reads).

---

## Workflow — how we ship (the loop)

1. **Describe** the task in plain English to Claude Code. **One task = one fresh branch.**
2. Claude Code **plans**, then works on its branch.
3. **Review:** read its plain-English summary; check WHICH files it touched (scope); for money / auth / security paths, eyeball the diff (or get a second opinion).
4. **PR → merge:** open a pull request, review "Files changed" in GitHub, merge into `main`.
5. **Deploy:** Vercel auto-deploys from `main` (~1–2 min).
6. **SQL (if any):** Claude Code can't run DB migrations — it hands you SQL to paste into Supabase → SQL Editor → Run.
7. **Test live:** verify the real behavior, against a clear "success looks like X."

**Review habits (non-negotiable before launch / before taking money):**
- Check *which files* changed — a copy task touching auth or payments is a red flag, even if you can't read the code.
- Test the *live behavior*, not just the diff.
- **Don't rely solely on one AI's review** — get a human technical review before real users and real money.
- One branch per task; review every diff; never let Claude Code auto-respond to PRs/CI unsupervised.
