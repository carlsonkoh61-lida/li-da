// Vercel serverless function → https://li-da.vercel.app/api/analyze?symbol=AAPL
// Pulls quote, news, fundamentals, analyst recs, profile, a peer group, AND daily
// price history (for technicals), then asks Claude for a grounded, trend-aware read.

const SYSTEM_PROMPT = `You are the analysis engine for one person's private stock-research tool.
You are NOT a financial advisor and must never give an order to obey. Your job is decision-support:
lay out both sides honestly so the person makes their own call.

You receive: the latest quote, recent news, basic fundamentals, analyst recommendation counts, a peer group
(each peer's P/E and margin), and "technicals" computed from the daily chart (trend from moving averages,
RSI(14) and its state, where price sits vs its 20- and 50-day moving averages, and how far it is off its
recent high/low).

Rules:
- Always give a real bear case, weighted equally with the bull case. Never hide the risks.
- Use concrete numbers from the fundamentals where they matter. NEVER invent a figure that is null.
- Treat analyst consensus as one input, not gospel.
- Factor the technicals into the read: note when price is stretched, oversold/overbought, or below/above
  key moving averages, and let the trend inform your bull/bear points, the "levels", and your confidence.
  Treat RSI and moving averages as CONTEXT, never as standalone buy/sell signals. If technicals are null, ignore them.
- Synthesize the news into "news_take": judge the signal and be honest about quality (thin/stale/noisy →
  "quiet" or "mixed"). Paraphrase; never quote.
- Pressure-test the thesis in "stress_test": the single load-bearing assumption; the kill switch; an honest
  fragility rating; and a base_rate reality anchor (a reality check, NOT a prediction). Be willing to rate "high".
- Compare to peers in "peer_take": where this sits vs peers on valuation (P/E) and quality (margins), set
  "relative" to premium / discount / in-line / mixed, and explain what the gap implies. If peer data is sparse, say so.
- Your "lean" is one input, not a verdict. Set "confidence" honestly; reserve "high" for clear-cut cases.
- Keep every point short, plain, jargon-free. No hype.
- Return ONLY a JSON object — no markdown, no code fences, no text before or after — in exactly this shape:
{
  "summary": "one plain sentence on where this stands",
  "bull": ["short point", "short point"],
  "bear": ["short point", "short point"],
  "lean": "buy" | "sell" | "hold",
  "confidence": "low" | "medium" | "high",
  "confidence_reason": "one short sentence on why",
  "levels": "plain-language note on price levels worth watching, or 'Not enough data'",
  "news_take": { "headline": "...", "signal": "positive|negative|mixed|quiet", "detail": "...", "what_matters": ["..."] },
  "stress_test": { "load_bearing": "...", "kill_switch": "...", "fragility": "low|medium|high", "fragility_reason": "...", "base_rate": "..." },
  "peer_take": { "relative": "premium|discount|in-line|mixed", "detail": "..." },
  "before_you_act": ["a question or reminder that pushes the reader to make their own decision"]
}`;

function nameTerms(name, symbol) {
  const terms = new Set();
  if (symbol) terms.add(symbol.toLowerCase());
  if (name) {
    const core = name.toLowerCase().replace(/[.,&]/g, " ")
      .replace(/\b(inc|incorporated|corp|corporation|co|company|ltd|limited|plc|holdings?|group|the|sa|ag|nv|class [a-z])\b/g, " ")
      .replace(/\s+/g, " ").trim();
    if (core) { terms.add(core); const first = core.split(" ")[0]; if (first.length >= 3) terms.add(first); }
  }
  return [...terms].filter((t) => t.length >= 3);
}

function sma(a, p) {
  const out = new Array(a.length).fill(null);
  let sum = 0;
  for (let i = 0; i < a.length; i++) { sum += a[i]; if (i >= p) sum -= a[i - p]; if (i >= p - 1) out[i] = sum / p; }
  return out;
}
function rsi14(a) {
  const p = 14, out = new Array(a.length).fill(null);
  if (a.length <= p) return out;
  let g = 0, l = 0;
  for (let i = 1; i <= p; i++) { const d = a[i] - a[i - 1]; if (d >= 0) g += d; else l -= d; }
  let ag = g / p, al = l / p;
  out[p] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  for (let i = p + 1; i < a.length; i++) {
    const d = a[i] - a[i - 1], gg = d > 0 ? d : 0, ll = d < 0 ? -d : 0;
    ag = (ag * (p - 1) + gg) / p; al = (al * (p - 1) + ll) / p;
    out[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return out;
}
function computeTechnicals(closes, current) {
  if (!Array.isArray(closes) || closes.length < 20) return null;
  const n = closes.length;
  const s20 = sma(closes, 20), s50 = sma(closes, 50), rsiArr = rsi14(closes);
  const ma20 = s20[n - 1], ma50 = s50[n - 1], rsi = rsiArr[n - 1];
  const cur = current != null ? current : closes[n - 1];
  const window = closes.slice(-Math.min(n, 60));
  const hi = Math.max(...window), lo = Math.min(...window);
  const pct = (a, b) => (b ? ((a - b) / b) * 100 : null);
  const round = (x, d = 1) => (x == null ? null : Number(x.toFixed(d)));
  let trend = "sideways";
  if (ma20 != null && ma50 != null) {
    if (ma20 > ma50 && cur >= ma20) trend = "up";
    else if (ma20 < ma50 && cur <= ma20) trend = "down";
  }
  let rsiState = "neutral";
  if (rsi != null) { if (rsi < 30) rsiState = "oversold"; else if (rsi > 70) rsiState = "overbought"; }
  return {
    trend, rsi: round(rsi, 0), rsiState,
    ma20: round(ma20, 2), ma50: round(ma50, 2),
    priceVsMA20: round(pct(cur, ma20), 1), priceVsMA50: round(pct(cur, ma50), 1),
    ma20VsMA50: ma20 != null && ma50 != null ? (ma20 >= ma50 ? "above" : "below") : null,
    pctOffHigh: round(pct(cur, hi), 1), pctOffLow: round(pct(cur, lo), 1),
  };
}

export default async function handler(req, res) {
  const symbol = (req.query.symbol || "").toUpperCase().trim();
  if (!symbol) return res.status(400).json({ error: "Add a symbol, e.g. /api/analyze?symbol=AAPL" });

  const FINNHUB = process.env.FINNHUB_API_KEY;
  const ANTHROPIC = process.env.ANTHROPIC_API_KEY;
  const TD = process.env.TWELVEDATA_API_KEY;
  if (!FINNHUB) return res.status(500).json({ error: "FINNHUB_API_KEY isn't set in Vercel." });
  if (!ANTHROPIC) return res.status(500).json({ error: "ANTHROPIC_API_KEY isn't set in Vercel yet." });

  try {
    const base = "https://finnhub.io/api/v1";
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().slice(0, 10);
    const pick = (v) => (typeof v === "number" ? v : null);

    const tdUrl = TD ? `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=80&apikey=${TD}` : null;

    const [quoteRes, newsRes, metricRes, recRes, profRes, peersRes, tdRes] = await Promise.all([
      fetch(`${base}/quote?symbol=${symbol}&token=${FINNHUB}`),
      fetch(`${base}/company-news?symbol=${symbol}&from=${fmt(weekAgo)}&to=${fmt(today)}&token=${FINNHUB}`),
      fetch(`${base}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB}`),
      fetch(`${base}/stock/recommendation?symbol=${symbol}&token=${FINNHUB}`),
      fetch(`${base}/stock/profile2?symbol=${symbol}&token=${FINNHUB}`),
      fetch(`${base}/stock/peers?symbol=${symbol}&token=${FINNHUB}`),
      tdUrl ? fetch(tdUrl).then((r) => r.json()).catch(() => null) : Promise.resolve(null),
    ]);

    const quote = await quoteRes.json();
    const newsRaw = await newsRes.json();
    const metricRaw = await metricRes.json();
    const recRaw = await recRes.json();
    const profile = await profRes.json();
    const peersRaw = await peersRes.json();
    const tdData = tdRes;

    if (!quote || quote.c === 0) {
      return res.status(404).json({ error: `No data for "${symbol}". Check the ticker.` });
    }

    // news filter
    const terms = nameTerms(profile && profile.name, symbol);
    const onTopic = (n) => { const blob = (`${n.headline || ""} ${n.summary || ""}`).toLowerCase(); return terms.some((t) => blob.includes(t)); };
    const allNews = Array.isArray(newsRaw) ? newsRaw : [];
    const filtered = allNews.filter(onTopic);
    const chosen = (filtered.length ? filtered : allNews).slice(0, 8);
    const news = chosen.map((n) => ({ headline: n.headline, summary: (n.summary || "").slice(0, 300), source: n.source || "", url: n.url || "", datetime: n.datetime || null }));

    // fundamentals
    const m = (metricRaw && metricRaw.metric) || {};
    const figures = {
      marketCap: pick(m.marketCapitalization), pe: pick(m.peTTM != null ? m.peTTM : m.peNormalizedAnnual),
      high52: pick(m["52WeekHigh"]), low52: pick(m["52WeekLow"]),
      profitMargin: pick(m.netProfitMarginTTM), revGrowth: pick(m.revenueGrowthTTMYoy),
      debtToEquity: pick(m["totalDebt/totalEquityQuarterly"]), currentRatio: pick(m.currentRatioQuarterly),
      eps: pick(m.epsTTM), beta: pick(m.beta),
    };

    // analyst
    const rr = Array.isArray(recRaw) && recRaw.length ? recRaw[0] : null;
    const analyst = rr ? { strongBuy: rr.strongBuy || 0, buy: rr.buy || 0, hold: rr.hold || 0, sell: rr.sell || 0, strongSell: rr.strongSell || 0, period: rr.period || "" } : null;

    // peers
    let peerSymbols = Array.isArray(peersRaw) ? peersRaw.filter((s) => s && s.toUpperCase() !== symbol).slice(0, 4) : [];
    const peerMetrics = await Promise.all(peerSymbols.map((s) => fetch(`${base}/stock/metric?symbol=${s}&metric=all&token=${FINNHUB}`).then((r) => r.json()).catch(() => null)));
    const peerRows = peerSymbols.map((s, i) => { const mm = (peerMetrics[i] && peerMetrics[i].metric) || {}; return { symbol: s, pe: pick(mm.peTTM != null ? mm.peTTM : mm.peNormalizedAnnual), margin: pick(mm.netProfitMarginTTM) }; });
    const peers = [{ symbol, pe: figures.pe, margin: figures.profitMargin, isTarget: true }, ...peerRows];

    // technicals from daily closes
    let technicals = null;
    if (tdData && Array.isArray(tdData.values)) {
      const closes = tdData.values.map((v) => Number(v.close)).filter((x) => !isNaN(x)).reverse();
      technicals = computeTechnicals(closes, quote.c);
    }

    const factPack = {
      symbol, company: (profile && profile.name) || symbol,
      price: quote.c, change: quote.d, percent: quote.dp, open: quote.o, prevClose: quote.pc, dayHigh: quote.h, dayLow: quote.l,
      fundamentals: figures, analyst,
      peers: peers.map((p) => ({ symbol: p.symbol, pe: p.pe, margin: p.margin })),
      technicals,
      recent_news: news.map((n) => ({ headline: n.headline, summary: n.summary })),
    };

    const userContent = `Here is the latest data for ${symbol}. Give your read.\n\n` + JSON.stringify(factPack, null, 2);

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": ANTHROPIC, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1700, system: SYSTEM_PROMPT, messages: [{ role: "user", content: userContent }] }),
    });

    const aiData = await aiRes.json();
    if (aiData.error) return res.status(502).json({ error: "Claude couldn't run: " + (aiData.error.message || "unknown error") });

    let text = (aiData.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    text = text.replace(/^```(json)?/i, "").replace(/```$/, "").trim();

    let read;
    try { read = JSON.parse(text); } catch (e) { return res.status(502).json({ error: "Claude's reply wasn't in the expected format. Try again." }); }

    return res.status(200).json({ symbol, read, news, figures, analyst, peers, technicals });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong running the read. Try again in a moment." });
  }
}
