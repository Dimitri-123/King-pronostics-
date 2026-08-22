// Vercel Serverless Function — shared daily prognostics storage.

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
      const buyers = 15 + Math.floor(Math.random() * 55); // always a credible non-zero number
      const successRate = req.body.successRate || 82 + Math.floor(Math.random() * 9);
      const entry = { id: `pg-${Date.now()}`, buyers, successRate, isNew: true, ...req.body, buyers, successRate };
      const updated = [entry, ...list].slice(0, 100);
      await kv.set(KEY, updated);
      return res.status(200).json(entry);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      const list = (await kv.get(KEY)) || [];
      const updated = list.filter((item) => item.id !== id);
      await kv.set(KEY, updated);
      return res.status(200).json({ deleted: id });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Storage error — is Vercel KV connected?" });
  }
}
