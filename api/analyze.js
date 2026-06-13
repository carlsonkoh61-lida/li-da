// Vercel serverless function → https://li-da.vercel.app/api/analyze?symbol=AAPL
// Put this at:  /api/analyze.js   (same api folder as market.js)
//
// Runs entirely server-side, so BOTH your keys stay off the browser:
//   1) pulls the latest quote + recent news from Finnhub
//   2) hands that to Claude (Sonnet 4.6) and asks for a structured "read"
// then returns clean JSON your page can lay out.

const SYSTEM_PROMPT = `You are the analysis engine for one person's private stock-research tool.
You are NOT a financial advisor and must never give an order to obey. Your job is decision-support:
lay out both sides honestly so the person makes their own call.

Rules:
- Always give a real bear case, weighted equally with the bull case. Never hide the risks.
- Your "lean" is one input, not a verdict. Set "confidence" honestly. Most real situations are "low" or "medium"; reserve "high" for genuinely clear-cut cases.
- Ground everything strictly in the data and news provided. Never invent facts, figures, price targets, or news. If the news is thin or missing, say so plainly.
- Paraphrase news in your own words; never quote articles at length.
- Keep every point short, plain, and jargon-free. No hype.
- Return ONLY a JSON object — no markdown, no code fences, no text before or after — in exactly this shape:
{
  "summary": "one plain sentence on where this stands",
  "bull": ["short point", "short point"],
  "bear": ["short point", "short point"],
  "lean": "buy" | "sell" | "hold",
  "confidence": "low" | "medium" | "high",
  "confidence_reason": "one short sentence on why",
  "levels": "plain-language note on price levels worth watching, or 'Not enough data'",
  "before_you_act": ["a question or reminder that pushes the reader to make their own decision"]
}`;

export default async function handler(req, res) {
  const symbol = (req.query.symbol || "").toUpperCase().trim();
  if (!symbol) return res.status(400).json({ error: "Add a symbol, e.g. /api/analyze?symbol=AAPL" });

  const FINNHUB = process.env.FINNHUB_API_KEY;
  const ANTHROPIC = process.env.ANTHROPIC_API_KEY;
  if (!FINNHUB) return res.status(500).json({ error: "FINNHUB_API_KEY isn't set in Vercel." });
  if (!ANTHROPIC) return res.status(500).json({ error: "ANTHROPIC_API_KEY isn't set in Vercel yet." });

  try {
    const base = "https://finnhub.io/api/v1";

    // news date range: the last 7 days
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().slice(0, 10);

    const [quoteRes, newsRes] = await Promise.all([
      fetch(`${base}/quote?symbol=${symbol}&token=${FINNHUB}`),
      fetch(`${base}/company-news?symbol=${symbol}&from=${fmt(weekAgo)}&to=${fmt(today)}&token=${FINNHUB}`),
    ]);
    const quote = await quoteRes.json();
    const newsRaw = await newsRes.json();

    if (!quote || quote.c === 0) {
      return res.status(404).json({ error: `No data for "${symbol}". Check the ticker.` });
    }

    // keep the 6 most recent headlines; pass only headline + a trimmed summary
    const news = Array.isArray(newsRaw)
      ? newsRaw.slice(0, 6).map((n) => ({ headline: n.headline, summary: (n.summary || "").slice(0, 300) }))
      : [];

    const factPack = {
      symbol,
      price: quote.c,
      change: quote.d,
      percent: quote.dp,
      open: quote.o,
      prevClose: quote.pc,
      dayHigh: quote.h,
      dayLow: quote.l,
      recent_news: news,
    };

    const userContent =
      `Here is the latest data for ${symbol}. Give your read.\n\n` + JSON.stringify(factPack, null, 2);

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    const aiData = await aiRes.json();

    if (aiData.error) {
      // surfaces auth / out-of-credit problems in plain words
      return res.status(502).json({ error: "Claude couldn't run: " + (aiData.error.message || "unknown error") });
    }

    // pull the text out, strip any stray code fences, parse the JSON
    let text = (aiData.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    text = text.replace(/^```(json)?/i, "").replace(/```$/, "").trim();

    let read;
    try {
      read = JSON.parse(text);
    } catch (e) {
      return res.status(502).json({ error: "Claude's reply wasn't in the expected format. Try again." });
    }

    return res.status(200).json({ symbol, read });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong running the read. Try again in a moment." });
  }
}
