// Vercel Serverless Function — fetches API-Football's official prediction
// for a fixture (win probability, over/under, advice). This is a PAID
// feature: the frontend only calls this after the visitor has unlocked
// the VIP ticket for the day (same 2100 FCFA payment covers both).
// Cached in KV for 2 hours to save API quota.

import { kv } from "@vercel/kv";

const RAPIDAPI_HOST = "api-football-v1.p.rapidapi.com";
const CACHE_TTL_SECONDS = 2 * 60 * 60; // 2 hours

export default async function handler(req, res) {
  const { fixture } = req.query;
  if (!fixture) {
    return res.status(400).json({ error: "Missing fixture id" });
  }

  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  if (!RAPIDAPI_KEY) {
    return res.status(200).json({ prediction: null, reason: "no_key" });
  }

  const cacheKey = `kp:prediction:${fixture}`;

  try {
    const cached = await kv.get(cacheKey);
    if (cached) {
      return res.status(200).json({ prediction: cached, reason: null, cached: true });
    }

    const apiRes = await fetch(
      `https://${RAPIDAPI_HOST}/v3/predictions?fixture=${fixture}`,
      {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      }
    );

    if (!apiRes.ok) {
      return res.status(200).json({ prediction: null, reason: `api_error_${apiRes.status}` });
    }

    const json = await apiRes.json();
    const data = json.response?.[0];

    if (!data) {
      return res.status(200).json({ prediction: null, reason: "empty" });
    }

    const simplified = {
      advice: data.predictions?.advice || null,
      winnerName: data.predictions?.winner?.name || null,
      winnerComment: data.predictions?.winner?.comment || null,
      winPercentHome: data.predictions?.percent?.home || null,
      winPercentDraw: data.predictions?.percent?.draw || null,
      winPercentAway: data.predictions?.percent?.away || null,
      goalsOverUnder: data.predictions?.under_over || null,
    };

    await kv.set(cacheKey, simplified, { ex: CACHE_TTL_SECONDS });

    return res.status(200).json({ prediction: simplified, reason: null, cached: false });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ prediction: null, reason: "exception" });
  }
}
