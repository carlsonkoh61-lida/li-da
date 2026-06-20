// Vercel serverless function  →  https://li-da.vercel.app/api/search
// Put this file at:  /api/search.js  in your li-da repo.
//
// Why: users think in names ("amazon"), not tickers ("AMZN"). The Desk calls
// THIS as you type, and this asks Finnhub's symbol-lookup — so the Finnhub key
// stays on the server, never in the browser.

export default async function handler(req, res) {
  const q = (req.query.q || "").trim();
  if (q.length < 2) return res.status(200).json({ results: [] });

  const KEY = process.env.FINNHUB_API_KEY;
  if (!KEY) return res.status(500).json({ error: "FINNHUB_API_KEY isn't set in Vercel yet." });

  try {
    const r = await fetch(`https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${KEY}`);
    const d = await r.json();
    const rows = Array.isArray(d.result) ? d.result : [];

    const results = rows
      .filter((x) => x.symbol && x.description)
      // drop exchange-prefixed / odd foreign listings (e.g. "EXCH:AMZN") to keep the list clean
      .filter((x) => !x.symbol.includes(":"))
      // keep equities, ETFs and ADRs; skip noise when a type is given
      .filter((x) => !x.type || /common stock|etf|adr/i.test(x.type))
      .slice(0, 8)
      .map((x) => ({ symbol: x.symbol, name: x.description, type: x.type || "" }));

    return res.status(200).json({ results });
  } catch (e) {
    return res.status(500).json({ error: "Search failed. Try again in a moment." });
  }
}
