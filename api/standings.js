// Vercel Serverless Function — fetches league standings from API-Football,
// cached in KV for 6 hours to avoid burning through the free 100/day quota.

import { kv } from "@vercel/kv";

const RAPIDAPI_HOST = "api-football-v1.p.rapidapi.com";
const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours

function currentSeason() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  // European seasons start around July/August — before that, we're still
  // in the previous season.
  return month >= 7 ? year : year - 1;
}

export default async function handler(req, res) {
  const { league } = req.query;
  if (!league) {
    return res.status(400).json({ error: "Missing league id" });
  }

  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  if (!RAPIDAPI_KEY) {
    return res.status(200).json({ standings: null, reason: "no_key" });
  }

  const season = currentSeason();
  const cacheKey = `kp:standings:${league}:${season}`;

  try {
    const cached = await kv.get(cacheKey);
    if (cached) {
      return res.status(200).json({ standings: cached, reason: null, cached: true });
    }

    const apiRes = await fetch(
      `https://${RAPIDAPI_HOST}/v3/standings?league=${league}&season=${season}`,
      {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      }
    );

    if (!apiRes.ok) {
      return res.status(200).json({ standings: null, reason: `api_error_${apiRes.status}` });
    }

    const json = await apiRes.json();
    const table = json.response?.[0]?.league?.standings?.[0] || null;

    if (!table) {
      return res.status(200).json({ standings: null, reason: "empty" });
    }

    const simplified = table.map((row) => ({
      rank: row.rank,
      team: row.team.name,
      logo: row.team.logo,
      played: row.all.played,
      win: row.all.win,
      draw: row.all.draw,
      lose: row.all.lose,
      points: row.points,
      goalsDiff: row.goalsDiff,
    }));

    await kv.set(cacheKey, simplified, { ex: CACHE_TTL_SECONDS });

    return res.status(200).json({ standings: simplified, reason: null, cached: false });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ standings: null, reason: "exception" });
  }
}
