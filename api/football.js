// Vercel Serverless Function — consolidates standings, predictions, squad,
// and odds into ONE function (instead of 4 separate files). Vercel's free
// Hobby plan caps deployments at 12 serverless functions total, so combining
// related endpoints like this keeps us under that limit.
//
// Usage: /api/football?type=standings&league=39
//        /api/football?type=predictions&fixture=12345
//        /api/football?type=squad&team=50
//        /api/football?type=odds&fixture=12345

import { kv } from "@vercel/kv";

const RAPIDAPI_HOST = "api-football-v1.p.rapidapi.com";

function currentSeason() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 7 ? year : year - 1;
}

async function callApiFootball(path, key) {
  const res = await fetch(`https://${RAPIDAPI_HOST}${path}`, {
    headers: { "x-rapidapi-key": key, "x-rapidapi-host": RAPIDAPI_HOST },
  });
  if (!res.ok) return { ok: false, status: res.status };
  const json = await res.json();
  return { ok: true, json };
}

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

      const season = currentSeason();
      const cacheKey = `kp:standings:${league}:${season}`;
      const cached = await kv.get(cacheKey);
      if (cached) return res.status(200).json({ standings: cached, cached: true });

      const { ok, json, status } = await callApiFootball(`/v3/standings?league=${league}&season=${season}`, RAPIDAPI_KEY);
      if (!ok) return res.status(200).json({ standings: null, reason: `api_error_${status}` });

      const table = json.response?.[0]?.league?.standings?.[0] || null;
      if (!table) return res.status(200).json({ standings: null, reason: "empty" });

      const simplified = table.map((row) => ({
        rank: row.rank, team: row.team.name, logo: row.team.logo,
        played: row.all.played, win: row.all.win, draw: row.all.draw, lose: row.all.lose,
        points: row.points, goalsDiff: row.goalsDiff,
      }));

      await kv.set(cacheKey, simplified, { ex: 6 * 60 * 60 });
      return res.status(200).json({ standings: simplified, cached: false });
    }

    // ---------- PREDICTIONS (paid feature, cache 2h) ----------
    if (type === "predictions") {
      const { fixture } = req.query;
      if (!fixture) return res.status(400).json({ error: "Missing fixture" });

      const cacheKey = `kp:prediction:${fixture}`;
      const cached = await kv.get(cacheKey);
      if (cached) return res.status(200).json({ prediction: cached, cached: true });

      const { ok, json, status } = await callApiFootball(`/v3/predictions?fixture=${fixture}`, RAPIDAPI_KEY);
      if (!ok) return res.status(200).json({ prediction: null, reason: `api_error_${status}` });

      const data = json.response?.[0];
      if (!data) return res.status(200).json({ prediction: null, reason: "empty" });

      const simplified = {
        advice: data.predictions?.advice || null,
        winnerName: data.predictions?.winner?.name || null,
        winnerComment: data.predictions?.winner?.comment || null,
        winPercentHome: data.predictions?.percent?.home || null,
        winPercentDraw: data.predictions?.percent?.draw || null,
        winPercentAway: data.predictions?.percent?.away || null,
        goalsOverUnder: data.predictions?.under_over || null,
      };

      await kv.set(cacheKey, simplified, { ex: 2 * 60 * 60 });
      return res.status(200).json({ prediction: simplified, cached: false });
    }

    // ---------- SQUAD (cache 24h) ----------
    if (type === "squad") {
      const { team } = req.query;
      if (!team) return res.status(400).json({ error: "Missing team" });

      const cacheKey = `kp:squad:${team}`;
      const cached = await kv.get(cacheKey);
      if (cached) return res.status(200).json({ squad: cached, cached: true });

      const { ok, json, status } = await callApiFootball(`/v3/players/squads?team=${team}`, RAPIDAPI_KEY);
      if (!ok) return res.status(200).json({ squad: null, reason: `api_error_${status}` });

      const players = json.response?.[0]?.players || [];
      const simplified = players.slice(0, 8).map((p) => ({
        name: p.name, age: p.age, position: p.position, photo: p.photo,
      }));

      await kv.set(cacheKey, simplified, { ex: 24 * 60 * 60 });
      return res.status(200).json({ squad: simplified, cached: false });
    }

    // ---------- ODDS (often unavailable on free plan, cache 3h if present) ----------
    if (type === "odds") {
      const { fixture } = req.query;
      if (!fixture) return res.status(400).json({ error: "Missing fixture" });

      const cacheKey = `kp:odds:${fixture}`;
      const cached = await kv.get(cacheKey);
      if (cached) return res.status(200).json({ odds: cached, cached: true });

      const { ok, json, status } = await callApiFootball(`/v3/odds?fixture=${fixture}`, RAPIDAPI_KEY);
      if (!ok) return res.status(200).json({ odds: null, reason: `api_error_${status}` });

      const bookmaker = json.response?.[0]?.bookmakers?.[0];
      const matchWinnerBet = bookmaker?.bets?.find((b) => b.name === "Match Winner");
      if (!matchWinnerBet) return res.status(200).json({ odds: null, reason: "unavailable_on_plan" });

      const simplified = {
        home: matchWinnerBet.values.find((v) => v.value === "Home")?.odd || null,
        draw: matchWinnerBet.values.find((v) => v.value === "Draw")?.odd || null,
        away: matchWinnerBet.values.find((v) => v.value === "Away")?.odd || null,
      };

      await kv.set(cacheKey, simplified, { ex: 3 * 60 * 60 });
      return res.status(200).json({ odds: simplified, cached: false });
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ data: null, reason: "exception" });
  }
}
