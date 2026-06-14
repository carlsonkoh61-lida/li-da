// Vercel serverless function → https://li-da.vercel.app/api/chart?symbol=AAPL&range=3m
// Put this at:  /api/chart.js
//
// Pulls daily OHLCV bars from Twelve Data (free tier) for the terminal chart.
// Fetches extra lookback beyond the visible window so moving averages and RSI
// are valid from the very first visible candle.

const RANGES = { "1m": 22, "3m": 66, "6m": 130, "1y": 252 };
const LOOKBACK = 60; // enough for SMA50 + RSI14 before the window starts

export default async function handler(req, res) {
  const symbol = (req.query.symbol || "").toUpperCase().trim();
  if (!symbol) return res.status(400).json({ error: "Add a symbol, e.g. /api/chart?symbol=AAPL" });

  const KEY = process.env.TWELVEDATA_API_KEY;
  if (!KEY) return res.status(500).json({ error: "TWELVEDATA_API_KEY isn't set in Vercel yet." });

  const range = (req.query.range || "3m").toLowerCase();
  const display = RANGES[range] || 66;
  const outputsize = display + LOOKBACK;

  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=${outputsize}&apikey=${KEY}`;
    const r = await fetch(url);
    const d = await r.json();

    if (!d || d.status === "error" || !Array.isArray(d.values)) {
      return res.status(502).json({ error: (d && d.message) || `No price history for "${symbol}".` });
    }

    // newest-first → oldest-first
    const points = d.values
      .map((v) => ({
        date: v.datetime,
        open: Number(v.open),
        high: Number(v.high),
        low: Number(v.low),
        close: Number(v.close),
        volume: Number(v.volume) || 0,
      }))
      .filter((p) => !isNaN(p.close))
      .reverse();

    if (points.length < 2) return res.status(404).json({ error: `Not enough price history for "${symbol}".` });

    return res.status(200).json({ symbol, range, display, points });
  } catch (err) {
    return res.status(500).json({ error: "Couldn't load price history. Try again in a moment." });
  }
}
