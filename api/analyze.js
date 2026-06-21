// Vercel serverless function → https://li-da.vercel.app/api/analyze?symbol=AAPL
// Quote, news, fundamentals, analyst recs, profile, peers, daily price history →
// technicals + a REAL base-rate (from the stock's own past) → trend-aware, hype-aware read.

const SYSTEM_PROMPT = `You are the analysis engine for one person's private stock-research tool.
You are NOT a financial advisor and must never give an order to obey. Your job is decision-support:
lay out both sides honestly so the person makes their own call.

WHO YOU ARE WRITING FOR — voice matters as much as substance.
The reader is a TOTAL BEGINNER, often in Southeast Asia, with little or no exposure to
stocks or trading. They may have typed in a ticker a friend mentioned without even knowing
what the company does. Write like a calm, knowledgeable friend explaining over coffee —
not a textbook, not a hype post. Short sentences, everyday words, no jargon dumps.
- WHAT IT DOES, FIRST: begin "summary" with ONE plain sentence on what the company actually
  does in everyday words (e.g. "NVIDIA makes the computer chips that power modern AI."), then
  a plain-English line on what's going on with the stock right now.
- SITUATION, NOT VERDICT: that opener says what's happening in human words — never what to do.
  The instant a beginner-friendly summary turns into a clean, confident-sounding answer, it
  becomes the hype machine this tool exists to resist.
- GLOSS EVERY TERM: keep real finance terms (beginners should learn them), but the FIRST time
  each appears, explain it inline in ~3-8 plain words — e.g. "a high P/E (priced expensively
  for its earnings)", "trading at a premium (pricier than similar companies)", "overbought
  (run up fast, may be due to cool off)". Never leave a term unexplained; keep each gloss short.
- SIMPLER WORDS, NOT SIMPLER TRUTH: being easy to read must never become falsely confident.
  The bear case stays equal to the bull, confidence stays a level (never a percentage), the
  lean stays one honest input and never an instruction, and you still say plainly what you
  don't know. A true beginner most wants to be told what to do; the caring thing is to not.

You receive: the latest quote, recent news, basic fundamentals, analyst recommendation counts, a peer group
(each peer's P/E and margin), "technicals" (trend from moving averages, RSI(14), price vs its 20- and 50-day
averages, distance off recent high/low), and a "hype" signal computed from the stock's OWN price history —
whether it is currently running hot (extended above its 50-day average, overbought, or freshly spiked) plus a
real base_rate: of the times this stock was in a similar state in the past, how often it was LOWER 20 trading
days later, and the median move. You also receive "regime": the stock's current market regime (an overall label, its volatility state with the typical daily move, and its volume behavior). You also receive "red_flags": objective warning signs computed from the fundamentals (losses, heavy debt, weak liquidity, shrinking revenue, stretched valuation), each with a severity. You also receive "earnings": the next scheduled earnings date (if known) and how the company has done against analyst EPS estimates recently. You also receive "insider": open-market insider buying vs selling over ~6 months (if available on this data tier).

Rules:
- Always give a real bear case, weighted equally with the bull case. Never hide the risks.
- Use concrete numbers from the fundamentals where they matter. NEVER invent a figure that is null.
- Treat analyst consensus as one input, not gospel.
- Factor technicals in: note when price is stretched, oversold/overbought, below/above key averages. Treat RSI
  and moving averages as CONTEXT, never standalone buy/sell signals.
- REGIME: factor the regime into your RISK framing. In high-volatility or choppy regimes, note that stops need more room, position size should be smaller, and whipsaws / failed breakouts are likelier; in calm trends, note conditions are more orderly. Reflect this in "levels", "stress_test", and "before_you_act". Describe how careful to be — do NOT prescribe a specific trading strategy to deploy. Decision-support, never a trade recommendation.
- RED FLAGS: weight any red_flags in your bear case and stress_test — they are the concrete downside, straight from the numbers. If red_flags is empty, do NOT manufacture concerns; a clean balance sheet is a legitimate finding worth stating. These come only from financial metrics, not filings or accounting footnotes — never imply a full forensic audit.
- EARNINGS: if earnings fall within ~2 weeks, flag the binary-event risk in stress_test and before_you_act (a scheduled report can swing the stock regardless of the thesis). Use the beat/miss record as an execution signal — consistent beats suggest the team hits its numbers, repeated misses are a concern — but don't overweight a small sample, and remember beating estimates is not the same as a good business.
- INSIDER ACTIVITY: "insider" summarizes open-market insider buying vs selling. Treat insider BUYING as a mild positive for the bull case — insiders rarely buy with their own money unless optimistic. Treat insider SELLING as a weak, noisy signal — executives sell for many benign reasons (taxes, diversification, scheduled plans), so mention heavy selling only as light bear-case context, never as proof of trouble. NEVER frame this as "follow the insiders" or a copy signal. If insider.available is false, say nothing about insiders at all.
- HYPE HANDLING — this matters most. When hype.hot is true, your bear case and stress_test must bite HARDER:
  explicitly name the risk of chasing a stretched price, weight the downside, and let confidence reflect that
  buying into strength means buying high. When hype.hot is false, do NOT manufacture alarm — give a balanced read.
- BASE RATE — use the REAL number, not generic reasoning, in stress_test.base_rate. If base_rate exists, phrase it
  with its sample size honestly, e.g. "In the past year this stock was this stretched 11 times and was lower 20
  days later in 7 (64%) — though that's a thin sample." If base_rate.thin is true or sample is small, explicitly
  call it suggestive only. If base_rate is null/unprecedented, say there's no comparable history rather than inventing one.
- Synthesize news into "news_take": judge the signal, be honest about quality (thin/stale/noisy → "quiet"/"mixed"). Paraphrase; never quote.
- Pressure-test in "stress_test": the load-bearing assumption; the kill switch; an honest fragility rating; and base_rate (the real number per above).
- Compare to peers in "peer_take": valuation (P/E) and quality (margins); set "relative" to premium/discount/in-line/mixed; if peer data is sparse, say so.
- LEAN — commit, don't hedge. "lean" is one input, not a verdict, but it must reflect where the evidence actually points:
  • Lean "buy" when the weight of evidence favors the upside — e.g. sound fundamentals, valuation reasonable or at a discount to peers, no significant red flags, not hype-extended, insider buying or a favorable base rate. You MAY lean buy at low or medium confidence.
  • Lean "sell" when the weight of evidence favors the downside — e.g. significant red flags, valuation stretched and deteriorating, hype-extended with a poor base rate, weak or shrinking margins/revenue versus peers.
  • Lean "hold" ONLY when the evidence is genuinely balanced, or too thin to favor either side — never as a way to avoid committing.
  Direction and certainty are SEPARATE: put which way the evidence tips in "lean", and how sure you are in "confidence" (reserve "high" for clear-cut cases). "Lean buy, low confidence" is a valid, useful answer; retreating to "hold" because you are merely uncertain is not. Do not default to hold to play it safe.
- This is decision-support, not a buy machine: a "buy" or "sell" lean is a reasoned read of the evidence for one person to weigh — never an instruction or a promise — and whenever you lean either way, the bull case, bear case, and stress_test must all still be present and honest.
- Keep every point short and plain; gloss finance terms inline (first use) as above. No hype.
- Return ONLY a JSON object — no markdown, no code fences, no text before or after — in exactly this shape:
{
  "summary": "ONE plain sentence on what the company does in everyday words, then a plain-English line on what's going on now — situation, never a verdict",
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

// Forward-looking base rate from the stock's OWN history.
function forwardBaseRate(closes, ma50arr, rsiArr, mode, threshold) {
  const n = closes.length, H = 20;
  const samples = [];
  for (let i = 50; i <= n - 1 - H; i++) {
    if (closes[i] == null) continue;
    const fwd = ((closes[i + H] - closes[i]) / closes[i]) * 100;
    if (mode === "ext") {
      if (ma50arr[i] == null) continue;
      const ext = ((closes[i] - ma50arr[i]) / ma50arr[i]) * 100;
      if (ext >= threshold) samples.push(fwd);
    } else {
      if (rsiArr[i] != null && rsiArr[i] >= threshold) samples.push(fwd);
    }
  }
  if (!samples.length) return null;
  const neg = samples.filter((x) => x < 0).length;
  const sorted = samples.slice().sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return {
    sample: samples.length,
    pct_lower_20d: Math.round((neg / samples.length) * 100),
    median_fwd_20d: Number(median.toFixed(1)),
    thin: samples.length < 6,
  };
}
function computeHype(closes, tech) {
  if (!tech || !Array.isArray(closes) || closes.length < 70) return { hot: false };
  const n = closes.length;
  const ma50arr = sma(closes, 50), rsiArr = rsi14(closes);
  const ext = tech.priceVsMA50, rsi = tech.rsi;
  const last5 = n >= 6 ? ((closes[n - 1] - closes[n - 6]) / closes[n - 6]) * 100 : null;
  const extended = ext != null && ext >= 8;
  const overbought = rsi != null && rsi >= 68;
  const spiked = last5 != null && last5 >= 12;
  if (!extended && !overbought && !spiked) return { hot: false };

  let base = null;
  if (extended) {
    const thr = Math.max(8, ext);
    base = forwardBaseRate(closes, ma50arr, rsiArr, "ext", thr);
    if (base) base.condition = `at least ${Math.round(thr)}% above its 50-day average (where it sits now)`;
    else base = { sample: 0, unprecedented: true, condition: `this far above its 50-day average` };
  } else if (overbought) {
    base = forwardBaseRate(closes, ma50arr, rsiArr, "rsi", 70);
    if (base) base.condition = `overbought (RSI ≥ 70)`;
    else base = { sample: 0, unprecedented: true, condition: `this overbought` };
  }
  return { hot: true, extended, overbought, spiked, last5d: last5 != null ? Number(last5.toFixed(1)) : null, base_rate: base };
}

function stdev(a) {
  if (a.length < 2) return 0;
  const m = a.reduce((x, y) => x + y, 0) / a.length;
  const v = a.reduce((x, y) => x + (y - m) * (y - m), 0) / (a.length - 1);
  return Math.sqrt(v);
}
function computeRegime(closes, volumes, tech) {
  if (!Array.isArray(closes) || closes.length < 30 || !tech) return null;
  const n = closes.length;
  const rets = [];
  for (let i = 1; i < n; i++) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  const recent = rets.slice(-20), typical = rets.slice(-Math.min(rets.length, 120));
  const rv = stdev(recent), tv = stdev(typical);
  const ratio = tv ? rv / tv : 1;
  let volState = "normal";
  if (ratio < 0.8) volState = "calm"; else if (ratio < 1.25) volState = "normal"; else if (ratio < 1.8) volState = "elevated"; else volState = "high";
  const avgDailyMove = recent.length ? (recent.reduce((s, x) => s + Math.abs(x), 0) / recent.length) * 100 : null;
  let volumeState = "steady", vr = 1;
  if (volumes && volumes.length >= 20) {
    const recV = volumes.slice(-10), baseV = volumes.slice(-Math.min(volumes.length, 60));
    const rm = recV.reduce((s, x) => s + x, 0) / recV.length, bm = baseV.reduce((s, x) => s + x, 0) / baseV.length;
    vr = bm ? rm / bm : 1;
    if (vr > 1.3) volumeState = "rising"; else if (vr < 0.7) volumeState = "fading"; else volumeState = "steady";
  }
  const trend = tech.trend, hot = volState === "high" || volState === "elevated";
  let label;
  if (trend === "up") label = volState === "high" ? "volatile uptrend" : (volState === "elevated" ? "uptrend, volatility rising" : "steady uptrend");
  else if (trend === "down") label = volState === "high" ? "volatile selloff" : (volState === "elevated" ? "downtrend, volatility rising" : "steady downtrend");
  else label = hot ? "choppy, indecisive" : "quiet range";
  const round = (x, d = 1) => (x == null ? null : Number(x.toFixed(d)));
  return { label, trend, volatility_state: volState, avg_daily_move_pct: round(avgDailyMove, 1), vol_vs_typical: round(ratio, 2), volume_state: volumeState, volume_vs_avg: round(vr, 2) };
}

function computeRedFlags(f) {
  if (!f) return { flags: [], score: 0, count: 0 };
  var flags = [];
  function add(severity, label, detail) { flags.push({ severity: severity, label: label, detail: detail }); }

  if (f.profitMargin != null && f.profitMargin < 0) add("high", "Unprofitable", "Net margin is " + f.profitMargin.toFixed(1) + "% \u2014 the business is losing money.");
  else if (f.profitMargin != null && f.profitMargin < 2) add("medium", "Razor-thin margins", "Net margin is just " + f.profitMargin.toFixed(1) + "% \u2014 almost no cushion if costs rise.");
  if (f.eps != null && f.eps < 0 && !(f.profitMargin != null && f.profitMargin < 0)) add("high", "Negative earnings", "EPS (TTM) is $" + f.eps.toFixed(2) + " \u2014 no trailing profit.");

  if (f.debtToEquity != null) {
    if (f.debtToEquity > 2.5) add("high", "Heavy debt load", "Debt/equity is " + f.debtToEquity.toFixed(2) + " \u2014 heavily leveraged.");
    else if (f.debtToEquity > 1.5) add("medium", "Elevated debt", "Debt/equity is " + f.debtToEquity.toFixed(2) + " \u2014 above a comfortable level.");
  }
  if (f.currentRatio != null) {
    if (f.currentRatio < 1) add("high", "Liquidity strain", "Current ratio is " + f.currentRatio.toFixed(2) + " \u2014 short-term obligations exceed short-term assets.");
    else if (f.currentRatio < 1.2) add("medium", "Tight liquidity", "Current ratio is " + f.currentRatio.toFixed(2) + " \u2014 limited short-term cushion.");
  }
  if (f.revGrowth != null && f.revGrowth < 0) add(f.revGrowth < -10 ? "high" : "medium", "Shrinking revenue", "Revenue is down " + Math.abs(f.revGrowth).toFixed(1) + "% year over year.");

  if (f.pe != null && f.eps != null && f.eps > 0) {
    if (f.pe > 100) add("high", "Extreme valuation", "P/E of " + f.pe.toFixed(0) + " prices in flawless execution for years.");
    else if (f.pe > 60) add("medium", "Priced for perfection", "P/E of " + f.pe.toFixed(0) + " leaves little room for disappointment.");
  }
  if (f.beta != null && f.beta > 2) add("low", "High volatility", "Beta of " + f.beta.toFixed(2) + " \u2014 swings far more than the market.");

  var wt = { high: 3, medium: 2, low: 1 };
  var score = Math.min(10, flags.reduce(function (sum, x) { return sum + (wt[x.severity] || 0); }, 0));
  return { flags: flags, score: score, count: flags.length };
}

function buildEarnings(histRaw, calRaw) {
  var out = { next_date: null, days_to: null, history: [], beats: 0, total: 0 };
  try {
    var cal = (calRaw && calRaw.earningsCalendar) || [];
    var today = new Date().toISOString().slice(0, 10);
    var upcoming = cal.filter(function (e) { return e && e.date && e.date >= today; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (upcoming.length) {
      out.next_date = upcoming[0].date;
      out.days_to = Math.round((new Date(upcoming[0].date) - new Date(today)) / 86400000);
    }
  } catch (e) {}
  try {
    var h = Array.isArray(histRaw) ? histRaw.slice(0, 4) : [];
    out.history = h.map(function (q) {
      var actual = typeof q.actual === "number" ? q.actual : null;
      var estimate = typeof q.estimate === "number" ? q.estimate : null;
      var beat = (actual != null && estimate != null) ? actual >= estimate : null;
      if (beat === true) out.beats++;
      if (actual != null && estimate != null) out.total++;
      return { period: q.period, actual: actual, estimate: estimate, surprisePercent: typeof q.surprisePercent === "number" ? q.surprisePercent : null, beat: beat };
    });
  } catch (e) {}
  return out;
}

async function verifyUser(req) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const ANON = process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !ANON) return { ok: false, code: 500, msg: "Server auth isn't configured (SUPABASE_URL / SUPABASE_ANON_KEY)." };
  const h = req.headers.authorization || req.headers.Authorization || "";
  const token = String(h).replace(/^Bearer\s+/i, "").trim();
  if (!token) return { ok: false, code: 401, msg: "Please sign in to use this." };
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: ANON } });
    if (!r.ok) return { ok: false, code: 401, msg: "Your session expired \u2014 please sign in again." };
    return { ok: true, user: await r.json() };
  } catch (e) {
    return { ok: false, code: 401, msg: "Couldn't verify your session \u2014 please sign in again." };
  }
}

function buildInsider(raw) {
  var out = { available: false, bought: 0, sold: 0, net: 0, buyTxns: 0, sellTxns: 0, buyers: 0, sellers: 0, window: "~6 months", signal: "none" };
  var data = raw && raw.data;
  if (!Array.isArray(data) || data.length === 0) return out;
  var buyerSet = {}, sellerSet = {};
  for (var i = 0; i < data.length; i++) {
    var t = data[i] || {};
    var code = String(t.transactionCode || "").toUpperCase();
    var change = Number(t.change);
    if (isNaN(change) || change === 0) continue;
    var isBuy = false, isSell = false;
    if (code === "P") isBuy = true;             // open-market purchase
    else if (code === "S") isSell = true;       // open-market sale
    else if (!code) { isBuy = change > 0; isSell = change < 0; }
    else continue;                              // skip grants/option exercises/gifts (noise)
    var shares = Math.abs(change);
    if (isBuy) { out.bought += shares; out.buyTxns++; if (t.name) buyerSet[t.name] = 1; }
    if (isSell) { out.sold += shares; out.sellTxns++; if (t.name) sellerSet[t.name] = 1; }
  }
  out.buyers = Object.keys(buyerSet).length;
  out.sellers = Object.keys(sellerSet).length;
  out.net = out.bought - out.sold;
  out.available = (out.buyTxns + out.sellTxns) > 0;
  if (out.available) {
    if (out.bought > 0 && out.sold === 0) out.signal = "buying";
    else if (out.sold > 0 && out.bought === 0) out.signal = "selling";
    else if (out.bought > out.sold * 1.5) out.signal = "net_buying";
    else if (out.sold > out.bought * 1.5) out.signal = "net_selling";
    else out.signal = "mixed";
  }
  return out;
}

// ---- shared read cache --------------------------------------------------
// /api/analyze is the costliest endpoint (~17 Finnhub calls + an Anthropic
// call per read). We cache each completed read by symbol for 15 minutes and
// share it across ALL users — a read is market analysis, not personal data,
// so one AAPL read serves everyone. State lives in Supabase (the `analyze_cache`
// table) because Vercel functions are stateless; we use the SERVICE key, which
// bypasses RLS, exactly like check-alerts.js. Cache failures NEVER break a read.
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

async function readCache(symbol) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SERVICE) return null;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/analyze_cache?symbol=eq.${encodeURIComponent(symbol)}&select=payload,created_at`,
      { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    if (!Array.isArray(rows) || !rows.length) return null;
    const ageMs = Date.now() - new Date(rows[0].created_at).getTime();
    if (ageMs > CACHE_TTL_MS) return null; // stale → treat as a miss
    return { payload: rows[0].payload, ageMs };
  } catch (e) {
    return null; // any cache trouble → just run the read fresh
  }
}

async function writeCache(symbol, payload) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SERVICE) return;
  try {
    // Upsert on the symbol primary key (resolution=merge-duplicates), refreshing
    // created_at so the 15-minute window restarts from this read.
    await fetch(`${SUPABASE_URL}/rest/v1/analyze_cache`, {
      method: "POST",
      headers: {
        apikey: SERVICE,
        Authorization: `Bearer ${SERVICE}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ symbol, payload, created_at: new Date().toISOString() }),
    });
  } catch (e) {
    /* a failed cache write must never break the read — swallow it */
  }
}

// ---- per-user hourly rate limit ----------------------------------------
// Caps expensive FRESH reads per user per clock-hour, so one account can't run
// up the Anthropic / Finnhub bill. Cache hits never reach here — they're served
// (and counted as free) before this runs. Caps live in code so they're easy to
// tune; tier defaults to 'free' when a user has no row in user_tier. State lives
// in Supabase (analyze_usage); we use the SERVICE key, like the cache.
// FAIL OPEN: if the check itself errors, we ALLOW the read — a real person must
// never be locked out by a DB hiccup.
const TIER_CAPS = { free: 8, paid: 200 }; // reads per hour
const FREE_CAP = 8;

// Start of the current clock hour in UTC — equivalent to date_trunc('hour', now())
// under Supabase's default UTC session. This is the window key.
function hourWindowISO() {
  const d = new Date();
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

async function checkRateLimit(userId) {
  const windowStart = hourWindowISO();
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_KEY;
  // No user id / not configured → fail open (allow).
  if (!userId || !SUPABASE_URL || !SERVICE) return { allowed: true, windowStart, used: 0 };
  try {
    const headers = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` };
    const [tierRes, usageRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/user_tier?user_id=eq.${userId}&select=tier`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/analyze_usage?user_id=eq.${userId}&window_start=eq.${encodeURIComponent(windowStart)}&select=count`, { headers }),
    ]);
    let tier = "free";
    if (tierRes.ok) { const t = await tierRes.json(); if (Array.isArray(t) && t[0] && t[0].tier) tier = String(t[0].tier).toLowerCase(); }
    let used = 0;
    if (usageRes.ok) { const u = await usageRes.json(); if (Array.isArray(u) && u[0] && typeof u[0].count === "number") used = u[0].count; }
    const limit = TIER_CAPS[tier] || FREE_CAP;
    return { allowed: used < limit, used, limit, tier, windowStart };
  } catch (e) {
    return { allowed: true, windowStart, used: 0 }; // fail open
  }
}

// Bump the counter after a successful fresh read. Upserts (user_id, window_start)
// to used+1. A failed write must NEVER break the read, so errors are swallowed.
async function recordRead(userId, windowStart, used) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_KEY;
  if (!userId || !SUPABASE_URL || !SERVICE) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/analyze_usage`, {
      method: "POST",
      headers: {
        apikey: SERVICE,
        Authorization: `Bearer ${SERVICE}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ user_id: userId, window_start: windowStart, count: (used || 0) + 1 }),
    });
  } catch (e) {
    /* fail open: never break the read on a counter write */
  }
}

export default async function handler(req, res) {
  const _auth = await verifyUser(req);
  if (!_auth.ok) return res.status(_auth.code).json({ error: _auth.msg });
  const symbol = (req.query.symbol || "").toUpperCase().trim();
  if (!symbol) return res.status(400).json({ error: "Add a symbol, e.g. /api/analyze?symbol=AAPL" });

  const FINNHUB = process.env.FINNHUB_API_KEY;
  const ANTHROPIC = process.env.ANTHROPIC_API_KEY;
  const TD = process.env.TWELVEDATA_API_KEY;
  if (!FINNHUB) return res.status(500).json({ error: "FINNHUB_API_KEY isn't set in Vercel." });
  if (!ANTHROPIC) return res.status(500).json({ error: "ANTHROPIC_API_KEY isn't set in Vercel yet." });

  try {
    // Cache hit? Serve the shared read straight back (no Finnhub / Anthropic calls).
    // Cache is checked FIRST so a hit is free and never counts against the limit.
    const hit = await readCache(symbol);
    if (hit) {
      return res.status(200).json({ ...hit.payload, cached: true, cachedAgeSec: Math.round(hit.ageMs / 1000) });
    }

    // Cache miss → this will be an expensive fresh read. Enforce the hourly cap
    // BEFORE doing any work, so a limited user spends nothing.
    const rl = await checkRateLimit(_auth.user && _auth.user.id);
    if (!rl.allowed) {
      return res.status(429).json({
        error: "You've reached your hourly read limit — upgrade to read more.",
        limit: rl.limit,
        used: rl.used,
        tier: rl.tier,
      });
    }

    const base = "https://finnhub.io/api/v1";
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const in120 = new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000);
    const sixMoAgo = new Date(today.getTime() - 182 * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().slice(0, 10);
    const pick = (v) => (typeof v === "number" ? v : null);

    const tdUrl = TD ? `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=300&apikey=${TD}` : null;

    const [quoteRes, newsRes, metricRes, recRes, profRes, peersRes, tdRes, earnRaw, calRaw, insiderRaw] = await Promise.all([
      fetch(`${base}/quote?symbol=${symbol}&token=${FINNHUB}`),
      fetch(`${base}/company-news?symbol=${symbol}&from=${fmt(weekAgo)}&to=${fmt(today)}&token=${FINNHUB}`),
      fetch(`${base}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB}`),
      fetch(`${base}/stock/recommendation?symbol=${symbol}&token=${FINNHUB}`),
      fetch(`${base}/stock/profile2?symbol=${symbol}&token=${FINNHUB}`),
      fetch(`${base}/stock/peers?symbol=${symbol}&token=${FINNHUB}`),
      tdUrl ? fetch(tdUrl).then((r) => r.json()).catch(() => null) : Promise.resolve(null),
      fetch(`${base}/stock/earnings?symbol=${symbol}&token=${FINNHUB}`).then((r) => r.json()).catch(() => null),
      fetch(`${base}/calendar/earnings?from=${fmt(today)}&to=${fmt(in120)}&symbol=${symbol}&token=${FINNHUB}`).then((r) => r.json()).catch(() => null),
      fetch(`${base}/stock/insider-transactions?symbol=${symbol}&from=${fmt(sixMoAgo)}&to=${fmt(today)}&token=${FINNHUB}`).then((r) => r.json()).catch(() => null),
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

    const terms = nameTerms(profile && profile.name, symbol);
    const onTopic = (n) => { const blob = (`${n.headline || ""} ${n.summary || ""}`).toLowerCase(); return terms.some((t) => blob.includes(t)); };
    const allNews = Array.isArray(newsRaw) ? newsRaw : [];
    const filtered = allNews.filter(onTopic);
    const chosen = (filtered.length ? filtered : allNews).slice(0, 8);
    const news = chosen.map((n) => ({ headline: n.headline, summary: (n.summary || "").slice(0, 300), source: n.source || "", url: n.url || "", datetime: n.datetime || null }));

    const m = (metricRaw && metricRaw.metric) || {};
    const figures = {
      marketCap: pick(m.marketCapitalization), pe: pick(m.peTTM != null ? m.peTTM : m.peNormalizedAnnual),
      high52: pick(m["52WeekHigh"]), low52: pick(m["52WeekLow"]),
      profitMargin: pick(m.netProfitMarginTTM), revGrowth: pick(m.revenueGrowthTTMYoy),
      debtToEquity: pick(m["totalDebt/totalEquityQuarterly"]), currentRatio: pick(m.currentRatioQuarterly),
      eps: pick(m.epsTTM), beta: pick(m.beta),
    };
    const redFlags = computeRedFlags(figures);
    const earnings = buildEarnings(earnRaw, calRaw);
    const insider = buildInsider(insiderRaw);

    const rr = Array.isArray(recRaw) && recRaw.length ? recRaw[0] : null;
    const analyst = rr ? { strongBuy: rr.strongBuy || 0, buy: rr.buy || 0, hold: rr.hold || 0, sell: rr.sell || 0, strongSell: rr.strongSell || 0, period: rr.period || "" } : null;

    let peerSymbols = Array.isArray(peersRaw) ? peersRaw.filter((s) => s && s.toUpperCase() !== symbol).slice(0, 4) : [];
    const peerMetrics = await Promise.all(peerSymbols.map((s) => fetch(`${base}/stock/metric?symbol=${s}&metric=all&token=${FINNHUB}`).then((r) => r.json()).catch(() => null)));
    const peerProfiles = await Promise.all(peerSymbols.map((s) => fetch(`${base}/stock/profile2?symbol=${s}&token=${FINNHUB}`).then((r) => r.json()).catch(() => null)));
    const peerRows = peerSymbols.map((s, i) => { const mm = (peerMetrics[i] && peerMetrics[i].metric) || {}; const pp = peerProfiles[i] || {}; return { symbol: s, name: pp.name || "", logo: pp.logo || "", marketCap: pick(mm.marketCapitalization), pe: pick(mm.peTTM != null ? mm.peTTM : mm.peNormalizedAnnual), margin: pick(mm.netProfitMarginTTM) }; });
    const peers = [{ symbol, name: (profile && profile.name) || symbol, logo: (profile && profile.logo) || "", marketCap: figures.marketCap, pe: figures.pe, margin: figures.profitMargin, isTarget: true }, ...peerRows];

    let technicals = null, hype = { hot: false }, regime = null, closes = null;
    if (tdData && Array.isArray(tdData.values)) {
      const bars = tdData.values.map((v) => ({ close: Number(v.close), volume: Number(v.volume) || 0 })).filter((b) => !isNaN(b.close)).reverse();
      closes = bars.map((b) => b.close);
      const volumes = bars.map((b) => b.volume);
      technicals = computeTechnicals(closes, quote.c);
      hype = computeHype(closes, technicals);
      regime = computeRegime(closes, volumes, technicals);
    }

    const factPack = {
      symbol, company: (profile && profile.name) || symbol,
      price: quote.c, change: quote.d, percent: quote.dp, open: quote.o, prevClose: quote.pc, dayHigh: quote.h, dayLow: quote.l,
      fundamentals: figures, analyst,
      peers: peers.map((p) => ({ symbol: p.symbol, pe: p.pe, margin: p.margin })),
      technicals, hype, regime, red_flags: redFlags, earnings, insider,
      recent_news: news.map((n) => ({ headline: n.headline, summary: n.summary })),
    };

    const userContent = `Here is the latest data for ${symbol}. Give your read.\n\n` + JSON.stringify(factPack, null, 2);

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": ANTHROPIC, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2800, system: SYSTEM_PROMPT, messages: [{ role: "user", content: userContent }] }),
    });

    const aiData = await aiRes.json();
    if (aiData.error) return res.status(502).json({ error: "Claude couldn't run: " + (aiData.error.message || "unknown error") });

    let text = (aiData.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    text = text.replace(/^```(json)?/i, "").replace(/```$/, "").trim();

    let read;
    try { read = JSON.parse(text); } catch (e) { return res.status(502).json({ error: "Claude's reply wasn't in the expected format. Try again." }); }

    const result = { symbol, read, news, figures, analyst, peers, technicals, hype, regime, redFlags, earnings, insider };
    await writeCache(symbol, result); // share this read for the next 15 min
    await recordRead(_auth.user && _auth.user.id, rl.windowStart, rl.used); // count this fresh read
    return res.status(200).json({ ...result, cached: false });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong running the read. Try again in a moment." });
  }
}
