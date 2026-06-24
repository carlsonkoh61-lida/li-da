# Li-Da — Roadmap

> A living plan. Update it at milestones, not after every commit. Order matters more than dates — but the near-term target is **weeks, moving fast.**

> See PRELAUNCH.md for the live pre-launch ledger (what's left, when, how).

> See LOOP.md for how the four rooms connect (the product loop).

## The near-term goal

**Get Li-Da "live and legit" — anyone can find it — then validate it with real strangers BEFORE the big public push.**

The honest reason for that order: the biggest unknown in this business isn't "can people find it," it's *"will people who need restraint actually want it and pay for it?"* A polished public launch is a one-shot bullet — don't fire it at an unvalidated product. First prove strangers use it and someone pays; *then* push hard.

---

## Milestone sequence

### M1 — Make it stranger-ready  ← we are here
The front door has to not confuse or scare a newcomer. This is the UI/UX phase.
- [x] **Visual direction decided** — "approachable premium," dark hero + light fast-follow (in CLAUDE.md)
- [x] **Logo decided** — "The Point" (two-tone diamond; ketupat story) (in CLAUDE.md)
- [x] **A real home / first screen** — the C+D merge, LIVE: manifesto hook → sample read (EXAMPLE-tagged) → search. Replaced the orb at index.html (PR #10)
- [x] **Anonymous taste-then-gate** — LIVE: one free inline read on home, then sign-up wall; per-browser cookie + per-IP abuse cap (5/24h), fails closed (PR #11)
- [ ] Parked polish, now with a target: tooltip styling · cached-read label placement · data-panel explanations · read structure/order
- [x] **Mobile/desktop pass** on the Desk — DONE: single centered column (≤800px) on wide desktop fixes the sparse/empty-gap layout; phone-first preserved (PR #21)
- [x] **Light compliance** — DONE: Disclaimer / Terms / Privacy pages live & footer-linked (PR #13). NOTE: covers data + reduces risk but does NOT resolve the licensing question — that's the legal consult (a disclaimer ≠ a licence; SC says so directly)
- [x] **Custom domain** — DONE: `li-da.app` live & secure (Cloudflare registrar, auto-configured DNS). "Dangerous" warning gone. (`www` redirect → apex; confirm www row goes green in Vercel)
- [x] **Confirm auth/login is solid** — sign-in works, per-user features hold. The reload-kick bug (signed-in users bounced to login on reload) is fixed & tested live (PR #20). NOTE: the deeper RLS / security review still remains pending for pre-launch.
- [x] **Read loading experience** — DONE: calm on-brand loading overlay — the LI◆DA mark with a gentle diamond pulse, a random anti-hype "fact," and an honest status line; full-screen "wall" so there's no mobile reflow (PRs #16/#17/#18). (Later, optional: stream the read as it generates — real build.)
- [x] **One-tap / Google (OAuth) login** — DONE: "Continue with Google" on the login page, wired to Supabase OAuth, lands on the Desk like email sign-in (PR #19). Lowers sign-up friction at the wall (big for mobile SEA). (OAuth app still in Testing mode — publish/verify before scaling past ~100 users; see Polish section.)
- [x] **Nav cleanup** — DONE: removed Home + Tasks from signed-in nav; signed-in users land on Desk (Tasks page kept in repo, unlinked)

> **Recently shipped (this session):** Desk single-column centered desktop layout (PR #21) · gold top-level disclaimers on the Desk (PR #22) · shared footer component `footer.js` — one injected legal/disclaimer footer that replaced four hand-forked footers across the active pages (PR #23) · autocomplete dropdown fixes — no longer reopens after picking a suggestion, and now closes the moment any read starts (PRs #24/#25).

### M2 — Go quietly live
- [ ] Deploy on the custom domain — **free, US stocks, to the Malaysian audience** (US-stocks-first defers the Bursa data cost)
- [ ] Sanity-check the whole flow end-to-end as a brand-new user would

### M3 — First ~10 real strangers (validate the experience)
- [ ] Get it in front of ~10 real people (friends-of-friends, a relevant community, a soft post)
- [ ] Watch where they get confused — this teaches what we literally cannot see ourselves
- [ ] Start closing the **trust loop**: the journal / track-record (the seed of the moat)

### M4 — First paying user (validate willingness to pay)
- [ ] **GATE: legal consult done** (before charging — see Gates)
- [ ] Turn on billing (Stripe); flip the pre-wired paid tier
- [ ] Pricing as an **experiment** (~RM19.90/mo), tune with real signups

### M5 — Polished public push
- [ ] Only once it converts: the bigger social/content launch, ROI-framed, honest

---

## Gates (what must happen before what)

- **Custom domain** → before strangers (M2). No one clicks past "Dangerous."
- **Light compliance** (disclaimers, info-not-advice, Terms/Privacy) → before strangers (M2), even while free.
- **Legal consult** (MY capital-markets lawyer, licensing question) → before **charging** (M4). Book it NOW — it's the long-pole external dependency.
- **Auth/login solid** → before strangers (M2).

---

## Parked for after launch (Phase 2 — the moat)

Deliberately not now. Build on validated users.
- Personalization: "what's making you hesitate?" → history-aware reads → proactive "Jarvis" nudges (with the cost guardrails in CLAUDE.md)
- Bursa Malaysia coverage (provider decision: EODHD lead candidate; only when revenue justifies the data cost)
- Multi-lingual (start English + Bahasa, watch honesty-in-translation + cache cost)

---

## Do-now actions (in parallel, don't block on them)
- [ ] **Book the legal consult** — it gates charging and has lead time
- [x] **Buy the domain** — DONE: li-da.app (Cloudflare), live & connected to Vercel
- [ ] Commit today's docs (CLAUDE.md, WORKFLOW.md, architecture, this roadmap)
- [ ] **Name-clearance search** on "Li-Da" — free via MyIPO IP Online + ASEAN TMview + WIPO. Do early, before building the brand further, so it isn't founded on an unusable name (short/common names collide more). Full trademark registration folds into the legal consult.
- [x] **Anonymous free-read count** — bumped 1 → 3 per browser (PR to bump shipped). Revisit again after watching real signup/bounce data. (Separate from the per-IP abuse cap, which is 5/24h.)

## Polish before the public push (M5) — not blockers for validation
- [ ] **Custom auth domain** (e.g. `auth.li-da.app`) so Google's consent screen says "li-da.app" instead of the raw `kwwjapbmkslbfdddbukn.supabase.co`. Cosmetic/trust polish; needs a Supabase custom-domain setup (may be a paid tier) + DNS. Login already works without it. Do before the polished public launch, not before the first ~10 strangers.
- [ ] **Publish the Google OAuth app + verification** (currently in Testing mode, 100-user cap; fine for validation). Publish/verify before scaling past ~100 users or going truly public.

## Login methods — watch, don't pre-build
- Now: Google one-tap + email = enough for validation. Google fits Android-heavy SEA well (most Malaysians have a Google account on their phone).
- Likely next IF friction shows at the wall: **phone-number / OTP login** (SMS or WhatsApp code) — often the MOST native onboarding for the Malay mass-market (how Grab/Shopee/local apps do it). Supabase supports phone auth; note ongoing per-SMS cost (e.g. Twilio).
- Lower priority: **Apple login** — only matters for the (smaller, wealthier) iPhone slice; not needed for web. 
- Principle: add login methods in response to REAL observed signup friction from the first strangers, not anticipated friction. Measure, then add.

## Regional login expansion (Phase 2 — as Li-Da expands beyond Malaysia)
Tie each provider to the country it actually unlocks; add only when entering that market, driven by real friction, not pre-built.
- **LINE** — dominant in Thailand (and big in Taiwan/Japan). The default identity rail for Thai users; near-essential when entering Thailand. Supabase supports LINE OAuth.
- **Indonesia / Vietnam / Philippines / Singapore** — no single "LINE-equivalent" monopolises these; the strongest universal rail is usually **phone-number / OTP login** (WhatsApp huge in ID/MY; Zalo dominant in Vietnam; Messenger/Viber in PH). So the highest-leverage regional move is robust **phone-OTP**, not a pile of social buttons. Consider Zalo specifically for Vietnam later if data shows it.
- Google + Apple cover the cross-regional Android/iPhone baseline everywhere.
- Principle (repeat): add a provider when ENTERING that market and only if real signup friction shows — each one is setup work + (for phone) ongoing SMS cost. Localised login is part of localising the whole product (language, market data, payments), not a standalone task.
