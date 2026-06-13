// Vercel serverless function → https://li-da.vercel.app/api/analyze?symbol=AAPL
// Put this at:  /api/analyze.js   (replaces the previous version)
//
// Runs entirely server-side, so both your keys stay off the browser.
// Now pulls FOUR things from Finnhub — quote, news, basic financials, and
// analyst recommendations — then hands them to Claude for a grounded read.

const SYSTEM_PROMPT = `You are the analysis engine for one person's private stock-research tool.
You are NOT a financial advisor and must never give an order to obey. Your job is decision-support:
lay out both sides honestly so the person makes their own call.

You receive: the latest quote, recent news, basic fundamentals (valuation, margins, growth,
balance-sheet ratios), and the latest analyst recommendation counts.

Rules:
- Always give a real bear case, weighted equally with the bull case. Never hide the risks.
- Use concrete numbers from the fundamentals in your points where they matter (e.g. cite the margin,
  the debt ratio, the 52-week range). This is what makes the read sharp. NEVER invent a figure that is
  null or missing — if it's not in the data, don't cite it.
- Treat analyst consensus as one input, not gospel.
- Your "lean" is one input, not a verdict. Set "confidence" honestly. Most real situations are "low" or
  "medium"; reserve "high" for genuinely clear-cut cases where the fundamentals and news clearly align.
- Ground everything strictly in the data provided. If something is thin or missing, say so plainly.
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

    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().slice(0, 10);

    // Four calls at once — all free-tier endpoints.
    const [quoteRes, newsRes, metricRes, recRes] = await Promise.all([
      fetch(`${base}/quote?symbol=${symbol}&token=${FINNHUB}`),
      fetch(`${base}/company-news?symbol=${symbol}&from=${fmt(weekAgo)}&to=${fmt(today)}&token=${FINNHUB}`),
      fetch(`${base}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB}`),
      fetch(`${base}/stock/recommendation?symbol=${symbol}&token=${FINNHUB}`),
    ]);

    const quote = await quoteRes.json();
    const newsRaw = await newsRes.json();
    const metricRaw = await metricRes.json();
    const recRaw = await recRes.json();

    if (!quote || quote.c === 0) {
      return res.status(404).json({ error: `No data for "${symbol}". Check the ticker.` });
    }

    // --- news: enrich for the UI, trim for the prompt ---
    const news = Array.isArray(newsRaw)
      ? newsRaw.slice(0, 6).map((n) => ({
          headline: n.headline,
          summary: (n.summary || "").slice(0, 300),
          source: n.source || "",
          url: n.url || "",
          datetime: n.datetime || null,
        }))
      : [];

    // --- fundamentals: pick a curated, useful subset (skip whatever's missing) ---
    const m = (metricRaw && metricRaw.metric) || {};
    const pick = (v) => (typeof v === "number" ? v : null);
    const figures = {
      marketCap: pick(m.marketCapitalization),            // in millions USD
      pe: pick(m.peTTM != null ? m.peTTM : m.peNormalizedAnnual),
      high52: pick(m["52WeekHigh"]),
      low52: pick(m["52WeekLow"]),
      profitMargin: pick(m.netProfitMarginTTM),           // %
      revGrowth: pick(m.revenueGrowthTTMYoy),             // %
      debtToEquity: pick(m["totalDebt/totalEquityQuarterly"]),
      currentRatio: pick(m.currentRatioQuarterly),
      eps: pick(m.epsTTM),
      beta: pick(m.beta),
    };

    // --- analyst recommendation: most recent period ---
    const r = Array.isArray(recRaw) && recRaw.length ? recRaw[0] : null;
    const analyst = r
      ? {
          strongBuy: r.strongBuy || 0,
          buy: r.buy || 0,
          hold: r.hold || 0,
          sell: r.sell || 0,
          strongSell: r.strongSell || 0,
          period: r.period || "",
        }
      : null;

    // What Claude sees (trim news to headline + summary to keep the prompt lean).
    const factPack = {
      symbol,
      price: quote.c,
      change: quote.d,
      percent: quote.dp,
      open: quote.o,
      prevClose: quote.pc,
      dayHigh: quote.h,
      dayLow: quote.l,
      fundamentals: figures,
      analyst,
      recent_news: news.map((n) => ({ headline: n.headline, summary: n.summary })),
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
      return res.status(502).json({ error: "Claude couldn't run: " + (aiData.error.message || "unknown error") });
    }

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

    // Return the read PLUS the raw inputs, so the page can show what it read.
    return res.status(200).json({ symbol, read, news, figures, analyst });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong running the read. Try again in a moment." });
  }
}
