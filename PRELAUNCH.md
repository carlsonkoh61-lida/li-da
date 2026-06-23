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
3. **Name clearance** on "Li-Da" — free via MyIPO / ASEAN TMview / WIPO. *When:* before building brand further.

## 🚀 Go live (M2)
Deploy free / US-stocks / MY audience · sanity-check whole flow as a brand-new user.

## 👥 Validate (M3–M4)
~10 real strangers · watch where they get confused · start the trust loop (journal/track-record) · then first paying user (**GATED on legal consult**).

## 🤔 Open questions (let them ponder)
- Free vs paid tier + pricing (RM19.90/mo experiment) — gated on legal answer
- Chart-as-translation-of-the-read (a Claude Design session)
- Login methods to watch (phone/OTP if friction shows) — measure, don't pre-build
