// Vercel Serverless Function — shared payment history storage,
// used by the private dashboard for both Dimitri and Kelvin to see the
// same revenue numbers regardless of which device they're on.

import { kv } from "@vercel/kv";

const KEY = "kp:payments";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const list = (await kv.get(KEY)) || [];
      return res.status(200).json(list);
    }

    if (req.method === "POST") {
      const list = (await kv.get(KEY)) || [];
      const entry = { id: `pay-${Date.now()}`, ...req.body };
      const updated = [entry, ...list].slice(0, 500);
      await kv.set(KEY, updated);
      return res.status(200).json(entry);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Storage error — is Vercel KV connected?" });
  }
}
