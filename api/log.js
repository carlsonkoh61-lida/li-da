// Vercel serverless function → GET https://li-da.vercel.app/api/logs
// Put this at:  /api/logs.js
//
// Reads your logged decisions back from Supabase (newest first).
// Uses the service key server-side, same safe pattern as /api/log.

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Use GET." });

  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!URL || !KEY) return res.status(500).json({ error: "Supabase isn't configured in Vercel yet." });

  try {
    const symbol = (req.query.symbol || "").toUpperCase().trim();
    let q = `${URL}/rest/v1/research_log?select=*&order=created_at.desc&limit=200`;
    if (symbol) q += `&symbol=eq.${encodeURIComponent(symbol)}`;

    const r = await fetch(q, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    const data = await r.json();
    if (!r.ok) {
      return res.status(502).json({ error: "Couldn't read journal: " + (data.message || JSON.stringify(data)) });
    }
    return res.status(200).json({ rows: Array.isArray(data) ? data : [] });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong reading the journal." });
  }
}
