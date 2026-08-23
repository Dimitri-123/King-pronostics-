// Vercel Serverless Function — fetches a team's squad (player names,
// positions, ages, photos). Cached in KV for 24 hours since squads
// rarely change day to day.

import { kv } from "@vercel/kv";

const RAPIDAPI_HOST = "api-football-v1.p.rapidapi.com";
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export default async function handler(req, res) {
  const { team } = req.query;
  if (!team) {
    return res.status(400).json({ error: "Missing team id" });
  }

  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  if (!RAPIDAPI_KEY) {
    return res.status(200).json({ squad: null, reason: "no_key" });
  }

  const cacheKey = `kp:squad:${team}`;

  try {
    const cached = await kv.get(cacheKey);
    if (cached) {
      return res.status(200).json({ squad: cached, reason: null, cached: true });
    }

    const apiRes = await fetch(
      `https://${RAPIDAPI_HOST}/v3/players/squads?team=${team}`,
      {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      }
    );

    if (!apiRes.ok) {
      return res.status(200).json({ squad: null, reason: `api_error_${apiRes.status}` });
    }

    const json = await apiRes.json();
    const players = json.response?.[0]?.players || [];

    const simplified = players.slice(0, 8).map((p) => ({
      name: p.name,
      age: p.age,
      position: p.position,
      photo: p.photo,
    }));

    await kv.set(cacheKey, simplified, { ex: CACHE_TTL_SECONDS });

    return res.status(200).json({ squad: simplified, reason: null, cached: false });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ squad: null, reason: "exception" });
  }
}
