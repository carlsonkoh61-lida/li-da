# Li-Da — Workflow & Review Guide

A plain-language reminder of how I (Carlson) build Li-Da, so I stay consistent and don't skip the safety steps. This is for *me*; `CLAUDE.md` is for the AI.

---

## The ship loop (every feature follows this)

1. **Describe** the task to Claude Code in plain English. *One task = one fresh branch* (keeps PRs clean).
2. Claude Code **plans** it, then works on its own branch.
3. **Review** before merging:
   - Read its plain-English summary — does it match what I asked?
   - Check *which files* it touched — is the scope right?
   - For anything touching money, login, or security: look at the diff (and ask for a second opinion).
4. **Open a PR**, look at "Files changed" in GitHub, then **Merge** into `main`.
5. **Vercel auto-deploys** from `main` (~1–2 minutes).
6. If there's **SQL**, paste it into Supabase → SQL Editor → Run. (Claude Code can't do this for me.)
7. **Test it live** — I decide upfront what "working" looks like, then confirm it.

---

## How to review even without deep coding knowledge

I don't need to read every line. I need three habits:

1. **Scope check** — *which files changed?* If I asked for a wording change and it edited the auth or payment code, that's a flag, even if I can't read the lines.
2. **Behavior test** — pull the ticker, click the button, watch what happens live. Testing real behavior IS real review, and it's the part I'm good at.
3. **Plain-English match** — does the session's own summary describe what I actually asked for?

---

## The non-negotiables (especially before launch / taking money)

- **Don't make any single AI my only reviewer** — not Claude Code, not the chat partner. Before real users and real money, get a **human technical review** (a developer friend, or a few paid freelancer hours) of the security and money paths.
- **One branch per task.** Review every diff. Never let Claude Code auto-respond to PRs or review comments unsupervised.
- **Test live, every time.** "It looks right in the diff" is not "it works in production."
- **Watch cost.** Flag anything that runs up Anthropic / data spend; a cheaper model or approach often does the job.

---

## Reminders that bit me before (so they don't again)

- Reads are **cached for 15 min** — to see a fresh change in the read, pull a ticker I *haven't* read recently (or wait out the cache).
- A merged PR's branch can't be reused — each new task gets a **new branch**.
- The `vercel.app` "Dangerous" warning is the shared-domain flag; only a **custom domain** kills it.
- Email/alerts only work against a **real inbox** (Resend drops fake test addresses).
