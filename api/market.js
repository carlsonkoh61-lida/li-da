// Vercel serverless function  →  lives at  https://li-da.vercel.app/api/market
// Put this file at:  /api/market.js  in your li-da repo.
//
// What it does: your browser page calls THIS, and this calls Finnhub.
// That way your Finnhub key stays on the server (never in the browser),
// and you skip the CORS walls that block direct browser calls.

export default async function handler(req, res) {
  const symbol = (req.query.symbol || "").toUpperCase().trim();

  if (!symbol) {
    return res.status(400).json({ error: "Add a symbol, e.g. /api/market?symbol=AAPL" });
  }

  const KEY = process.env.FINNHUB_API_KEY;
  if (!KEY) {
    return res.status(500).json({ error: "FINNHUB_API_KEY isn't set in Vercel yet." });
  }

  try {
    const base = "https://finnhub.io/api/v1";

    // Two calls at once: the live quote, and the company profile
    // (for the name, logo, and sector — all used by the hero card).
    const [quoteRes, profileRes] = await Promise.all([
      fetch(`${base}/quote?symbol=${symbol}&token=${KEY}`),
      fetch(`${base}/stock/profile2?symbol=${symbol}&token=${KEY}`),
    ]);

    const quote = await quoteRes.json();
    const profile = await profileRes.json();

    // Finnhub returns c (current price) = 0 for tickers it doesn't recognise.
    if (!quote || quote.c === 0) {
      return res.status(404).json({ error: `No data for "${symbol}". Check the ticker.` });
    }

    // ---- data sanity guard --------------------------------------------------
    // Finnhub's free tier silently serves stale or frozen prices for delisted /
    // defunct tickers (e.g. MVPS, a dead ETF stuck at its last trade). Rather
    // than pass a wrong number through as if it were live, we flag it so the
    // Desk can warn honestly. We DON'T block — the user still sees the number,
    // just with a caution. (CLAUDE.md: honest about bad data, never fabricate.)
    const STALE_DAYS = 5; // generous — clears normal weekend / holiday gaps

    let stale = false;
    let staleReason = "";

    // Missing core fields → we can't trust the quote at all.
    if (quote.pc == null || quote.c == null) {
      stale = true;
      staleReason = "core price fields are missing from the data feed";
    } else if (quote.t) {
      // quote.t is the quote's own timestamp, in Unix SECONDS.
      const ageMs = Date.now() - quote.t * 1000;
      const ageDays = ageMs / 86400000;
      if (ageDays > STALE_DAYS) {
        stale = true;
        const whole = Math.floor(ageDays);
        staleReason = `last trade was ${whole} day${whole === 1 ? "" : "s"} ago — the ticker may be delisted or defunct`;
      }
    } else {
      // No timestamp at all is itself a red flag for a supposedly-live quote.
      stale = true;
      staleReason = "the data feed returned no trade timestamp";
    }

    return res.status(200).json({
      symbol,
      name: profile.name || symbol,
      logo: profile.logo || "",                 // company logo URL — for the hero's logo tile
      industry: profile.finnhubIndustry || "",  // sector, e.g. "Technology" — for the hero's sector pill
      price: quote.c,      // current price
      change: quote.d,     // change vs previous close
      percent: quote.dp,   // percent change
      high: quote.h,
      low: quote.l,
      open: quote.o,
      prevClose: quote.pc,
      quoteTime: quote.t ? new Date(quote.t * 1000).toISOString() : null, // the quote's own timestamp
      stale,               // true when the data looks frozen/defunct — see staleReason
      staleReason,         // short human-readable reason, empty when not stale
      asOf: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: "Couldn't reach Finnhub. Try again in a moment." });
  }
}
