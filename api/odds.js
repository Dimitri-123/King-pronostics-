// Vercel Serverless Function — fetches real bookmaker odds for a fixture.
// IMPORTANT LIMITATION: API-Football's free RapidAPI plan often returns
// empty results for /odds (it's frequently a paid-tier feature). This
// endpoint tries anyway and simply returns null if nothing comes back —
// the frontend falls back to the existing placeholder odds in that case.
// Cached in KV for 3 hours when real odds ARE available.

import { kv } from "@vercel/kv";

const RAPIDAPI_HOST = "api-football-v1.p.rapidapi.com";
const CACHE_TTL_SECONDS = 3 * 60 * 60;

export default async function handler(req, res) {
  const { fixture } = req.query;
  if (!fixture) {
    return res.status(400).json({ error: "Missing fixture id" });
  }

  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  if (!RAPIDAPI_KEY) {
    return res.status(200).json({ odds: null, reason: "no_key" });
  }

  const cacheKey = `kp:odds:${fixture}`;

  try {
    const cached = await kv.get(cacheKey);
    if (cached) {
      return res.status(200).json({ odds: cached, reason: null, cached: true });
    }

    const apiRes = await fetch(
      `https://${RAPIDAPI_HOST}/v3/odds?fixture=${fixture}`,
      {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      }
    );

    if (!apiRes.ok) {
      return res.status(200).json({ odds: null, reason: `api_error_${apiRes.status}` });
    }

    const json = await apiRes.json();
    const bookmaker = json.response?.[0]?.bookmakers?.[0];
    const matchWinnerBet = bookmaker?.bets?.find((b) => b.name === "Match Winner");

    if (!matchWinnerBet) {
      // Expected on the free plan — not an error, just unavailable.
      return res.status(200).json({ odds: null, reason: "unavailable_on_plan" });
    }

    const simplified = {
      home: matchWinnerBet.values.find((v) => v.value === "Home")?.odd || null,
      draw: matchWinnerBet.values.find((v) => v.value === "Draw")?.odd || null,
      away: matchWinnerBet.values.find((v) => v.value === "Away")?.odd || null,
    };

    await kv.set(cacheKey, simplified, { ex: CACHE_TTL_SECONDS });

    return res.status(200).json({ odds: simplified, reason: null, cached: false });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ odds: null, reason: "exception" });
  }
}
