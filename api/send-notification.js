// Vercel Serverless Function — sends a real push notification to every
// subscribed client. Triggered manually from the admin dashboard.
// Requires VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT env vars.

import { kv } from "@vercel/kv";
import webpush from "web-push";

const KEY = "kp:push_subscriptions";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: "Missing title or body" });
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:contact@kingpronostics.com",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const list = (await kv.get(KEY)) || [];
    const payload = JSON.stringify({ title, body });

    let sent = 0;
    const stillValid = [];

    for (const subscription of list) {
      try {
        await webpush.sendNotification(subscription, payload);
        sent += 1;
        stillValid.push(subscription);
      } catch (err) {
        // Subscription expired or invalid — drop it silently.
        if (err.statusCode !== 410 && err.statusCode !== 404) {
          stillValid.push(subscription);
        }
      }
    }

    await kv.set(KEY, stillValid);

    return res.status(200).json({ sent, total: list.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to send notifications" });
  }
}
