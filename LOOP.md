# Li-Da — The Loop
*How the four rooms (Desk · Watchlist · Journal · Alerts) connect into one living system. The product isn't four pages — it's a loop. Living doc.*

## The loop
**watch → read → log → alert → re-read → (repeat, compounding)**

A user's week, one stock:
1. **Watch** — add to Watchlist. *Intent: "I care about this."*
2. **Read** — tap → Desk pulls a read. *The thinking happens.*
3. **Log** — make a call in Your Move (entry/stop/target + reasoning) → saved to Journal. *Commitment, on record.*
4. **Alert** — price hits stop/target, earnings, or news → Li-Da pings. *The reason to come back.*
5. **Re-read** — alert → fresh Desk read → update the Journal entry. *Loop closes; the moat forms.*

## Build status (verified 24 Jun)
- ✅ **Log → Alert prompt** — live
- ✅ **Notifier** (alert fires → email in Li-Da's voice → deep link to fresh read) — live, confirmed
- ✅ **Watch ↔ Log auto-add** — live (logging a call adds the ticker to the Watchlist; duplicate-safe). Verified live 24 Jun.
- ⚠️ **Watchlist tap → Desk** — works, but always fires a fresh AI read; the cached/two-tap freshness rule is not yet built (defer to pre-stranger cost pass)
- ❓ **Journal-talks-back** — not built (its own design chapter; the moat layer)

**Next brick:** the two remaining loop items are ⚠️ **Watchlist two-tap freshness** (deferred to the pre-stranger cost pass) and ❓ **Journal-talks-back** (its own design chapter, the moat layer).

## The five connections (mostly wiring up what already exists)
- **✅ BUILT & LIVE — Watch ↔ Log:** logging a call auto-adds the ticker to Watchlist (logging = caring = tracking). *Verified live 24 Jun: logging a call adds the ticker to the Watchlist, duplicate-safe (already-watched stocks don't error or duplicate).*
- **⚠️ PARTIAL — Watchlist tap → Desk:** lands on the *cached* read + live price + chart, with a "pull fresh read" button. Cheap + instant; fresh read is the user's *choice*. (Routine browse — don't burn an API call.) *Verified 24 Jun: tapping a watchlist row deep-links to the Desk (`?symbol=`) and loads the read, which works — BUT it currently fires a full fresh AI read every time, not the intended cached-read-on-browse. The two-tap freshness rule (browse = cached, react = fresh) is NOT yet implemented.*
- **✅ BUILT & LIVE — Log → Alert (KEYSTONE):** at the moment of logging, prompt to set alerts *prefilled with the entry/stop/target just entered* (reuse Alert UI). Maximum intent, zero re-entry. Turns a static journal entry into a living one. *Verified live 24 Jun: the post-log "watch your exits?" prompt creates alerts at stop/target.*
- **✅ effectively covered — Alert tap → Desk:** lands on a *fresh* read — because something genuinely changed (price move / news / earnings). Spending an API call is justified here. *The notifier email deep-links back to `research.html?symbol=` for a fresh read (the same fresh-read-on-arrival behaviour). Notifier confirmed live (real alert emails received).*
- **❓ NOT BUILT — Journal → engagement/care (THE MOAT):** the Journal is not a static list. It attends to the user — surfaces outcomes ("you called Buy at $202, target hit"), checks in, reflects patterns. Care delivered through an *honest mirror*, never flattery: "your call worked, but was the reasoning right or lucky?" *Verified 24 Jun: Journal is still a static list; the "talks back / surfaces outcomes" layer doesn't exist yet.*

## Rule of thumb — two taps, two freshnesses
Behaviour depends on *why* the user is there: **browsing (Watchlist tap) → cached read. Reacting to a change (Alert tap) → fresh read.** Same destination (Desk), different freshness.

## Guardrails (carried from the predictions/advice decision + brand soul)
- **"Communal" = every user individually cared for** — NOT a social feed of other users' trades. A users-see-each-others'-calls feed would gut the independent-reasoning brand AND likely trigger CMSA signal-service regulation. Care = honest mirror to *your own* thinking, one user at a time.
- **Personalized, never flattering:** the loop makes Li-Da sharper *per-user* (the compounding-OS USP), but it must get more personalized without getting less honest. It learns you in order to *challenge* you better, not to tell you what you want to hear.
- **No verdicts:** the loop deepens *reasoning*, never adds predictions/advice. (See PRELAUNCH.md guardrail.)

## Build order (progress as of 24 Jun)
1. ✅ **Log → Alert prompt** (keystone, smallest, highest "feels alive" payoff, reuses existing UI). — **DONE & live.** *(Plus the notifier: alert fires → email in Li-Da's voice → deep link to a fresh read — confirmed live.)*
2. ✅ **Watch ↔ Log auto-add.** — **DONE & live.**
3. ⬜ **Two-tap freshness rule** (browse = cached, react = fresh). — not built; defer to the pre-stranger cost pass (today the Watchlist tap always fires a fresh read).
4. ⬜ **Journal-talks-back** (outcomes + check-ins) — the moat layer. Its own design chapter, not a quick edit.

## The compounding vision this serves
More input from a user (journal entries, behaviour) → more personalized, sharper output *for that user*. The USP no competitor can copy: they don't have *your* history with *you*. The loop is the road; the compounding OS is the destination.
