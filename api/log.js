// Vercel serverless function → POST https://li-da.vercel.app/api/log
// Put this at:  /api/log.js
//
// Writes one research decision to your Supabase "research_log" table.
// Uses the Supabase SERVICE key, kept server-side — it must NEVER go in the browser.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!URL || !KEY) return res.status(500).json({ error: "Supabase isn't configured in Vercel yet." });

  try {
    const b = req.body || {};
    if (!b.symbol) return res.status(400).json({ error: "Missing symbol." });

    const num = (v) => (v === "" || v == null || isNaN(Number(v)) ? null : Number(v));

    const row = {
      symbol: String(b.symbol).toUpperCase().slice(0, 12),
      price_at_log: num(b.price),
      ai_lean: b.ai_lean || null,
      ai_confidence: b.ai_confidence || null,
      ai_summary: b.ai_summary || null,
      decision: b.decision || null,
      entry: num(b.entry),
      stop_loss: num(b.stop_loss),
      take_profit: num(b.take_profit),
      reasoning: (b.reasoning || "").slice(0, 2000) || null,
    };

    const r = await fetch(`${URL}/rest/v1/research_log`, {
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(row),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(502).json({ error: "Couldn't save: " + (data.message || JSON.stringify(data)) });
    }
    return res.status(200).json({ saved: Array.isArray(data) ? data[0] : data });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong saving. Try again." });
  }
}
