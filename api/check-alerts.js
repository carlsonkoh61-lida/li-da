// Vercel serverless function → /api/check-alerts.js
//
// The always-on heart of Li-Da alerts. An external scheduler pings this every
// few minutes. It reads every ACTIVE alert, checks the live price, and for any
// whose level is reached: emails the owner and marks it "triggered" (so it won't
// fire twice). Protected by CRON_SECRET so only your scheduler can run it.
//
// Needs these Vercel env vars: CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY,
// FINNHUB_API_KEY, RESEND_API_KEY.

export default async function handler(req, res) {
  // 1. Gatekeeper: only run if the caller knows the secret.
  const SECRET = process.env.CRON_SECRET;
  const given =
    (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim() ||
    (req.query.key || "");
  if (!SECRET || given !== SECRET) return res.status(401).json({ error: "Unauthorized." });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_KEY;
  const FINNHUB = process.env.FINNHUB_API_KEY;
  const RESEND = process.env.RESEND_API_KEY;
  if (!SUPABASE_URL || !SERVICE || !FINNHUB) {
    return res.status(500).json({ error: "Server not fully configured (Supabase / Finnhub)." });
  }

  try {
    // 2. Read all ACTIVE alerts (service key — server-side only, bypasses RLS).
    const aRes = await fetch(
      `${SUPABASE_URL}/rest/v1/alerts?status=eq.active&select=*`,
      { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } }
    );
    const alerts = await aRes.json();
    if (!Array.isArray(alerts) || alerts.length === 0) {
      return res.status(200).json({ checked: 0, fired: 0, emailed: 0, note: "No active alerts." });
    }

    // 3. One live quote per unique symbol.
    const symbols = [...new Set(alerts.map((a) => a.symbol))];
    const prices = {};
    await Promise.all(
      symbols.map(async (sym) => {
        try {
          const q = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${FINNHUB}`);
          const d = await q.json();
          if (d && typeof d.c === "number" && d.c > 0) prices[sym] = d.c;
        } catch (e) {}
      })
    );

    // 4. Which alerts have hit their level?
    const fired = [];
    for (const a of alerts) {
      const price = prices[a.symbol];
      if (price == null) continue;
      const hit =
        (a.direction === "above" && price >= Number(a.threshold)) ||
        (a.direction === "below" && price <= Number(a.threshold));
      if (hit) fired.push({ alert: a, price });
    }

    // 5. Mark each fired alert (first, so a failed email can't cause re-spam), then email.
    let emailed = 0;
    for (const f of fired) {
      const a = f.alert;
      await fetch(`${SUPABASE_URL}/rest/v1/alerts?id=eq.${a.id}`, {
        method: "PATCH",
        headers: {
          apikey: SERVICE,
          Authorization: `Bearer ${SERVICE}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          status: "triggered",
          triggered_at: new Date().toISOString(),
          triggered_price: f.price,
        }),
      });

      if (RESEND && a.email) {
        try {
          const subject = `Li-Da: ${a.symbol} is ${a.direction} $${Number(a.threshold).toFixed(2)}`;
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Li-Da <onboarding@resend.dev>", // swap to alerts@yourdomain once you verify it
              to: [a.email],
              subject,
              html: emailHtml(a, f.price),
            }),
          });
          if (r.ok) emailed++;
        } catch (e) {}
      }
    }

    return res.status(200).json({ checked: alerts.length, fired: fired.length, emailed });
  } catch (err) {
    return res.status(500).json({ error: "Checker failed: " + (err.message || String(err)) });
  }
}

function emailHtml(a, price) {
  const dir = a.direction === "above" ? "risen above" : "fallen below";
  const note = a.note
    ? `<p style="color:#8A8F9E;font-size:14px;margin:0 0 4px;">Your reason: <i>${escapeHtml(a.note)}</i></p>`
    : "";
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#0B0D14;color:#ECECF1;padding:28px;border-radius:14px;max-width:520px;margin:0 auto;">
    <div style="font-family:monospace;letter-spacing:0.18em;color:#8576FF;font-size:12px;">LI-DA · ALERT</div>
    <h2 style="font-size:22px;margin:10px 0 8px;font-weight:600;">${escapeHtml(a.symbol)} has ${dir} your level.</h2>
    <p style="font-size:16px;margin:0 0 6px;">Now at <b style="font-family:monospace;">$${Number(price).toFixed(2)}</b> — your level was <b style="font-family:monospace;">$${Number(a.threshold).toFixed(2)}</b>.</p>
    ${note}
    <p style="color:#8A8F9E;font-size:13px;line-height:1.6;margin-top:18px;">You set this level in advance, with intention. This is your plan reaching its trigger — not a cue to chase. Pull a fresh read before you act.</p>
    <p style="font-size:14px;margin-top:16px;"><a href="https://li-da.vercel.app/research.html?symbol=${encodeURIComponent(a.symbol)}" style="color:#8576FF;text-decoration:none;font-weight:600;">Pull a read on ${escapeHtml(a.symbol)} →</a></p>
  </div>`;
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
