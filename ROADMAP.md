# Li-Da — Roadmap

> A living plan. Update it at milestones, not after every commit. Order matters more than dates — but the near-term target is **weeks, moving fast.**

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
- [ ] **Mobile/desktop pass** on the Desk (phone-first done; Desk looks sparse on wide desktop — needs a centered max-width pass)
- [x] **Light compliance** — DONE: Disclaimer / Terms / Privacy pages live & footer-linked (PR #13). NOTE: covers data + reduces risk but does NOT resolve the licensing question — that's the legal consult (a disclaimer ≠ a licence; SC says so directly)
- [x] **Custom domain** — DONE: `li-da.app` live & secure (Cloudflare registrar, auto-configured DNS). "Dangerous" warning gone. (`www` redirect → apex; confirm www row goes green in Vercel)
- [ ] **Confirm auth/login is solid** — sign-in works, per-user features hold, secure
- [ ] **Read loading experience** — show the work while a read generates (step labels / skeleton card / calm on-brand copy). Felt-speed fix; no engine change. (Later, optional: stream the read as it generates — real build.)
- [ ] **One-tap / Google (OAuth) login** — late-M1 conversion finish, before the stranger push. Supabase supports it; needs OAuth provider setup (Google Cloud creds + redirect URLs) + the button. Lowers sign-up friction at the wall (big for mobile SEA). Real work, not a toggle; not a launch blocker, but a leaky sign-up wastes earned traffic.
- [x] **Nav cleanup** — DONE: removed Home + Tasks from signed-in nav; signed-in users land on Desk (Tasks page kept in repo, unlinked)

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
