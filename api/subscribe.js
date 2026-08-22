// Vercel Serverless Function — stores a client's push subscription so we
// can send them real push notifications later (even when the site is closed).

import { kv } from "@vercel/kv";

const KEY = "kp:push_subscriptions";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const subscription = req.body;
      if (!subscription?.endpoint) {
        return res.status(400).json({ error: "Invalid subscription" });
      }
      const list = (await kv.get(KEY)) || [];
      const exists = list.some((s) => s.endpoint === subscription.endpoint);
      if (!exists) {
        list.push(subscription);
        await kv.set(KEY, list);
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Storage error" });
  }
}
