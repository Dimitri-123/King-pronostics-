import { kv } from "@vercel/kv";

const KEY = "kp:prognostics";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const list = (await kv.get(KEY)) || [];
      return res.status(200).json(list);
    }

    if (req.method === "POST") {
      const list = (await kv.get(KEY)) || [];
      const entry = { id: `pg-${Date.now()}`, buyers: 0, isNew: true, ...req.body };
      const updated = [entry, ...list].slice(0, 100);
      await kv.set(KEY, updated);
      return res.status(200).json(entry);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Storage error — is Vercel KV connected?" });
  }
}
