export default async ({ req, res, log, error }) => {
  if (req.method !== "POST") {
    return res.json({ error: "Method not allowed" }, 405);
  }

  const webhookUrl = process.env.WINDMILL_WEBHOOK_URL;
  const webhookKey = process.env.WINDMILL_WEBHOOK_KEY;

  if (!webhookUrl || !webhookKey) {
    error("Windmill bridge is missing required environment variables.");
    return res.json({ error: "Bridge is not configured" }, 503);
  }

  let target;
  try {
    target = new URL(webhookUrl);
  } catch {
    return res.json({ error: "Bridge configuration is invalid" }, 503);
  }

  if (target.protocol !== "https:") {
    return res.json({ error: "Webhook must use HTTPS" }, 503);
  }

  let payload;
  try {
    payload = req.bodyJson ?? JSON.parse(req.bodyText || "{}");
  } catch {
    return res.json({ error: "Request body must be valid JSON" }, 400);
  }

  try {
    const upstream = await fetch(target.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ClearFlow-Webhook-Key": webhookKey
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });

    const text = await upstream.text();
    let result;
    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { response: text.slice(0, 2000) };
    }

    log(`Windmill webhook returned HTTP ${upstream.status}`);
    return res.json(
      { ok: upstream.ok, upstreamStatus: upstream.status, result },
      upstream.ok ? 200 : 502
    );
  } catch (e) {
    error(`Windmill webhook request failed: ${e?.message || "unknown error"}`);
    return res.json({ error: "Windmill webhook unavailable" }, 502);
  }
};