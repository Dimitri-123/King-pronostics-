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
//
// IMPORTANT — 27/08/2026: the copy of this file in the last project zip had
// reverted to the pre-fix field names (`response.standings` / `goalsDiff`).
// The real API returns `response.standing` (singular) and `goalConDiff` —
// confirmed against the RapidAPI playground earlier in this project. If you
// ever edit this file by hand, keep these two field names as-is below.
// Also added: a short-lived (2 min) cache on API errors (429/401/etc.) so a
// RapidAPI quota outage doesn't get hammered by every page refresh.

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
    // ---------- STANDINGS (cache 6h on success, 2min on failure) ----------
    if (type === "standings") {
      const { league } = req.query;
      if (!league) return res.status(400).json({ error: "Missing league" });

      const cacheKey = `kp:standings:${league}`;
      const cached = await kv.get(cacheKey);
      if (cached) return res.status(200).json({ ...cached, cached: true });

      const apiRes = await fetch(
        `https://${STANDINGS_HOST}/football-get-standing-all?leagueid=${league}`,
        { headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": STANDINGS_HOST } }
      );

      if (!apiRes.ok) {
        const payload = { standings: null, reason: `api_error_${apiRes.status}` };
        await kv.set(cacheKey, payload, { ex: 2 * 60 });
        return res.status(200).json(payload);
      }

      const json = await apiRes.json();
      // NOTE: "standing" is singular in this API's response — do not change
      // to "standings" (see file header note above).
      const rows = json.response?.standing || [];
      if (!rows.length) {
        const payload = { standings: null, reason: "empty" };
        await kv.set(cacheKey, payload, { ex: 2 * 60 });
        return res.status(200).json(payload);
      }

      const simplified = rows.map((row) => ({
        rank: row.idx,
        team: row.name,
        played: row.played,
        win: row.wins,
        draw: row.draws,
        lose: row.losses,
        points: row.pts,
        // NOTE: this API calls it "goalConDiff", not "goalsDiff" — do not
        // change (see file header note above).
        goalsDiff: row.goalConDiff,
      }));

      const payload = { standings: simplified, reason: null };
      // Cache 48h — this API's monthly quota is a hard-capped 100
      // requests/month shared with api/matches.js. See the budget note
      // in api/matches.js's file header before lowering this.
      await kv.set(cacheKey, payload, { ex: 48 * 60 * 60 });
      return res.status(200).json(payload);
    }

    // ---------- PREDICTIONS (paid feature, cache 1h on success, 2min on failure) ----------
    if (type === "predictions") {
      const cacheKey = "kp:predictions:today";
      const cached = await kv.get(cacheKey);
      if (cached) return res.status(200).json({ ...cached, cached: true });

      const apiRes = await fetch(
        `https://${PREDICTIONS_HOST}/predictions/list?page=1`,
        { headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": PREDICTIONS_HOST } }
      );

      if (!apiRes.ok) {
        const payload = { predictions: null, reason: `api_error_${apiRes.status}` };
        await kv.set(cacheKey, payload, { ex: 2 * 60 });
        return res.status(200).json(payload);
      }

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

      const payload = { predictions: simplified, reason: null };
      await kv.set(cacheKey, payload, { ex: 60 * 60 });
      return res.status(200).json(payload);
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ data: null, reason: "exception" });
  }
}
