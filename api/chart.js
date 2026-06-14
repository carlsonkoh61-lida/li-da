// Vercel serverless function → https://li-da.vercel.app/api/chart?symbol=AAPL
// Put this at:  /api/chart.js
//
// Pulls ~90 daily closes from Twelve Data (free tier) for the price-trend chart.
// Key kept server-side, same safe pattern as the others.

export default async function handler(req, res) {
  const symbol = (req.query.symbol || "").toUpperCase().trim();
  if (!symbol) return res.status(400).json({ error: "Add a symbol, e.g. /api/chart?symbol=AAPL" });

  const KEY = process.env.TWELVEDATA_API_KEY;
  if (!KEY) return res.status(500).json({ error: "TWELVEDATA_API_KEY isn't set in Vercel yet." });

  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=90&apikey=${KEY}`;
    const r = await fetch(url);
    const d = await r.json();

    // Twelve Data signals problems with { status: "error", message }
    if (!d || d.status === "error" || !Array.isArray(d.values)) {
      return res.status(502).json({ error: (d && d.message) || `No price history for "${symbol}".` });
    }

    // values come newest-first; reverse to oldest-first for the chart
    const points = d.values
      .map((v) => ({ date: v.datetime, close: Number(v.close) }))
      .filter((p) => !isNaN(p.close))
      .reverse();

    if (!points.length) return res.status(404).json({ error: `No price history for "${symbol}".` });

    return res.status(200).json({ symbol, points });
  } catch (err) {
    return res.status(500).json({ error: "Couldn't load price history. Try again in a moment." });
  }
}
