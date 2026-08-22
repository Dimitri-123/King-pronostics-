// Vercel Serverless Function — shared ticket gallery storage.
// Requires Vercel KV to be connected (Storage tab -> Create Database -> KV).
// Vercel auto-injects the needed env vars, nothing to copy-paste manually.

import { kv } from "@vercel/kv";

const KEY = "kp:tickets";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const list = (await kv.get(KEY)) || [];
      return res.status(200).json(list);
    }

    if (req.method === "POST") {
      const list = (await kv.get(KEY)) || [];
      const entry = { id: `tk-${Date.now()}`, timestamp: new Date().toISOString(), ...req.body };
      const updated = [entry, ...list].slice(0, 200); // keep it bounded
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
