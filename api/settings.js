import { kv } from "@vercel/kv";

const KEY = "kp:settings";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const settings = (await kv.get(KEY)) || { sharePercent: 50 };
      return res.status(200).json(settings);
    }

    if (req.method === "POST") {
      const current = (await kv.get(KEY)) || { sharePercent: 50 };
      const updated = { ...current, ...req.body };
      await kv.set(KEY, updated);
      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Storage error — is Vercel KV connected?" });
  }
}
