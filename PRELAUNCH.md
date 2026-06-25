# Li-Da — Pre-Launch Ledger
*The "what's left, when, and how" before going live. Living doc — update at milestones.*

**Near-term goal:** Get Li-Da live & legit (free, US stocks, Malaysian audience), validate with ~10 real strangers, *then* the bigger public push. Validate before firing the one-shot launch bullet.

## ✅ Done (recent)
- Login reload-kick bug fixed & tested live
- Desk: single centered column (desktop gap killed)
- Gold disclaimers + shared footer component (`footer.js`)
- Autocomplete dropdown fix
- Google OAuth login · read loading experience · custom domain · light compliance pages

## 🔨 Small build gaps — before strangers
- **Handle AI-overloaded gracefully** — the raw red "Claude couldn't run: Overloaded" looks broken to a newcomer; replace with calm amber + retry. (Anthropic-side error, but hits at the worst moment — a stranger's first read.) *How:* small UI change. *When:* before stranger push.
- Desk parked polish (tooltip styling, cached-read label, read order) — *when:* low priority, batch before strangers.

## 🧱 The real walls (ordered by fuse length)
1. **Legal consult — LONGEST FUSE, book first.** Does Li-Da fall under the CMSA? If so, what's the lightest compliant path? *How:* one consult with a Malaysian capital-markets lawyer (NOT a self-serve CMSL application). Draft the message, ask initial-consult fee. *When:* do-now — gates charging, you don't control their calendar.
2. **Pre-launch security/readiness review** — RLS on every Supabase table (locked to `auth.uid()`?), keys server-side, caching, per-user rate limiting, free/paid tier wiring. *When:* before live.
   - ✅ **RLS review done (verified live 25 Jun 2026).** All core user-data tables (`research_log`, `watchlist`, `alerts`) have RLS on and every policy scoped to `auth.uid() = user_id`; service key is server-side only (never shipped to the browser). Canonical schema + policies now committed at `supabase/schema.sql` (version-controlled, diffable, restorable). *Open (minor):* consider `research_log.user_id SET NOT NULL` to match the other tables — the policy already enforces ownership, so this is belt-and-suspenders.
3. **Name clearance** on "Li-Da" — free via MyIPO / ASEAN TMview / WIPO. *When:* before building brand further.

## 🛡️ Guardrail — decided (don't relitigate)
Li-Da informs, it does **not** advise. No predictions, no "BUY/SELL signals," no ML return-forecasting. Two reasons: (1) it destroys the anti-hype differentiation — "reasoning, never a verdict" IS the product; (2) giving "advice" likely triggers CMSA-regulated activity, so "data + reasoning, you decide" is the lightest legal path. Deepen *reasoning* (better stress-tests, sharper bull/bear, chart-as-translation), never add *verdicts*. Enhancement ideas welcome — they get stress-tested against this guardrail.

## 🚀 Go live (M2)
Deploy free / US-stocks / MY audience · sanity-check whole flow as a brand-new user.

## 👥 Validate (M3–M4)
~10 real strangers · watch where they get confused · start the trust loop (journal/track-record) · then first paying user (**GATED on legal consult**).

## 🤔 Open questions (let them ponder)
- Free vs paid tier + pricing (RM19.90/mo experiment) — gated on legal answer
- Chart-as-translation-of-the-read (a Claude Design session)
- Login methods to watch (phone/OTP if friction shows) — measure, don't pre-build
- Age acknowledgment / 18+ — needed? As a gate or just a Terms clause? *Ask the legal consult.* (NOT a Reddit-style mature-content gate — wrong tool.)
