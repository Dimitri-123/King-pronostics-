// Vercel Serverless Function — consolidates standings and predictions into
// ONE function (Vercel's free Hobby plan caps deployments at 12 serverless
// functions total, so combining endpoints like this keeps us under that).
//
// - "standings" uses "Free API Live Football Data" (same RAPIDAPI_KEY as matches.js)
// - "predictions" uses "Today Football Prediction" (same RAPIDAPI_KEY, different host)
//   This is the PAID feature — only called by the frontend after VIP unlock.
//
// Usage: /api/football?type=standings&league=47
//        /api/football?type=predictions

import { kv } from "@vercel/kv";

const STANDINGS_HOST = "free-api-live-football-data.p.rapidapi.com";
const PREDICTIONS_HOST = "today-football-prediction.p.rapidapi.com";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const { type } = req.query;
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

  if (!RAPIDAPI_KEY) {
    return res.status(200).json({ data: null, reason: "no_key" });
  }

  try {
    // ---------- STANDINGS (cache 6h) ----------
    if (type === "standings") {
      const { league } = req.query;
      if (!league) return res.status(400).json({ error: "Missing league" });

      const cacheKey = `kp:standings:${league}`;
      const cached = await kv.get(cacheKey);
      if (cached) return res.status(200).json({ standings: cached, cached: true });

      const apiRes = await fetch(
        `https://${STANDINGS_HOST}/football-get-standing-all?leagueid=${league}`,
        { headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": STANDINGS_HOST } }
      );

      if (!apiRes.ok) return res.status(200).json({ standings: null, reason: `api_error_${apiRes.status}` });

      const json = await apiRes.json();
      const rows = json.response?.standings || [];
      if (!rows.length) return res.status(200).json({ standings: null, reason: "empty" });

      const simplified = rows.map((row) => ({
        rank: row.idx,
        team: row.name,
        played: row.played,
        win: row.wins,
        draw: row.draws,
        lose: row.losses,
        points: row.pts,
        goalsDiff: row.goalsDiff,
      }));

      await kv.set(cacheKey, simplified, { ex: 6 * 60 * 60 });
      return res.status(200).json({ standings: simplified, cached: false });
    }

    // ---------- PREDICTIONS (paid feature, cache 1h) ----------
    if (type === "predictions") {
      const cacheKey = "kp:predictions:today";
      const cached = await kv.get(cacheKey);
      if (cached) return res.status(200).json({ predictions: cached, cached: true });

      const apiRes = await fetch(
        `https://${PREDICTIONS_HOST}/predictions/list?page=1`,
        { headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": PREDICTIONS_HOST } }
      );

      if (!apiRes.ok) return res.status(200).json({ predictions: null, reason: `api_error_${apiRes.status}` });

      const json = await apiRes.json();
      const rows = json.matches || [];

      const simplified = rows.slice(0, 30).map((m) => ({
        id: m.id,
        home: m.home_team,
        away: m.away_team,
        date: m.date,
        prediction: m.prediction,
        odd: m.prediction_odd,
        probability: m.prediction_probability,
        finished: m.is_finished,
        resultScore: m.result_score || null,
        wasCorrect: m.is_prediction_correct ?? null,
      }));

      await kv.set(cacheKey, simplified, { ex: 60 * 60 });
      return res.status(200).json({ predictions: simplified, cached: false });
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ data: null, reason: "exception" });
  }
}
