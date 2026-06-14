// Vercel serverless function → POST https://li-da.vercel.app/api/coach
// Put this at:  /api/coach.js
//
// Receives the person's own logged calls + graded outcomes (assembled by the
// journal page) and asks Claude for an honest, calibrated read on how they
// make decisions. Coaches PROCESS, not picks. Never a financial advisor.

const SYSTEM_PROMPT = `You are Li-Da's discipline coach. You review ONE person's own logged stock-research calls to help them improve their PROCESS — not to pick stocks, and never as a financial advisor. You coach behavior and decision quality.

You receive a summary and a list of their calls. Each call has: the ticker, what they decided (buy/sell/watch/skip), what Li-Da's AI leaned and whether they went along or overrode it, their entry/stop/target and risk:reward, their written reasoning, and the graded outcome so far (win = hit their target, loss = hit their stop, open = unresolved, ungraded = no exits set).

Your job: hold up an honest mirror to how they make decisions.

Critical calibration rules:
- Be brutally honest about sample size. Real behavioral patterns need many RESOLVED calls. If few have resolved, DO NOT claim outcome-based patterns — say plainly it's too early, and focus on how they STRUCTURE trades (judgeable from a single call).
- Never invent a pattern to sound insightful. "Not enough resolved calls yet" is a valid, expected answer.
- Structural red flags are fair game even with one call: an absurd risk:reward (a target the stock realistically can't reach, e.g. 1:55), no stop set, or a stop/target price action can't plausibly hit. Flag these directly and concretely.
- Note when they override Li-Da's lean, but don't moralize — overriding is legitimate. Just surface the tendency, and only judge whether overrides "work" if enough resolved calls support it.
- Watch for hype-driven reasoning in their written notes (FOMO, "the next big thing", narrative over numbers) and gently name it — that is exactly the trap this tool exists to catch.
- Be specific: cite the actual tickers and numbers. No generic advice that could apply to anyone.
- Plain language. No flattery, no hype, no piling on. Honest and useful, like a good coach.
- Each pattern gets a confidence: "tentative" (small sample / structural inference), "emerging" (a few resolved calls point this way), "clear" (well-supported by many resolved calls).

Return ONLY a JSON object — no markdown, no code fences, no text outside it:
{
  "headline": "one honest sentence on where their decision-making stands right now",
  "data_note": "one honest sentence on what can and cannot be concluded from this sample size",
  "strengths": ["specific good habit with evidence — empty array if none yet"],
  "watch_outs": ["specific risky tendency or structural red flag, with evidence"],
  "patterns": [{ "pattern": "...", "evidence": "...", "confidence": "tentative|emerging|clear" }],
  "one_thing": "the single most useful thing for them to focus on next"
}`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const ANTHROPIC = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC) return res.status(500).json({ error: "ANTHROPIC_API_KEY isn't set in Vercel yet." });

  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    const calls = (body && Array.isArray(body.calls)) ? body.calls : [];
    const summary = (body && body.summary) || {};
    if (!calls.length) return res.status(400).json({ error: "No calls to review yet." });

    const pack = { summary, calls };
    const userContent = `Here are this person's own logged research calls. Give your honest coaching read.\n\n` + JSON.stringify(pack, null, 2);

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": ANTHROPIC, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1300, system: SYSTEM_PROMPT, messages: [{ role: "user", content: userContent }] }),
    });

    const aiData = await aiRes.json();
    if (aiData.error) return res.status(502).json({ error: "Claude couldn't run: " + (aiData.error.message || "unknown error") });

    let text = (aiData.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    text = text.replace(/^```(json)?/i, "").replace(/```$/, "").trim();

    let coaching;
    try { coaching = JSON.parse(text); } catch (e) { return res.status(502).json({ error: "Claude's reply wasn't in the expected format. Try again." }); }

    return res.status(200).json({ coaching });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong running the coach. Try again in a moment." });
  }
}
