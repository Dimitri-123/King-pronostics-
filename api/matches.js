// Vercel Serverless Function — fetches today's real fixtures from
// "Free API Live Football Data" (RapidAPI), server-side to avoid CORS.
// Set RAPIDAPI_KEY in Vercel -> Settings -> Environment Variables.
//
// v2 (26/08/2026): now filters down to a whitelist of "big" competitions
// (Premier League, Liga, Serie A, Bundesliga, Ligue 1, Champions League,
// Europa League) instead of every match on Earth, and attaches a 1-N-2 odds
// snapshot (Bet365) to each match. League IDs below were confirmed against
// this API's own "Get League Detail by League ID" endpoint on 26/08/2026 —
// if a competition ever looks off, re-check its ID there before touching
// anything else.
import { kv } from "@vercel/kv";

const POPULAR_LEAGUES = {
  47: "Premier League",
  87: "Liga",
  55: "Serie A",
  54: "Bundesliga",
  53: "Ligue 1",
  42: "Ligue des Champions",
  73: "Ligue Europa",
};

// Max number of matches we'll fetch odds for per request. Each one is an
// extra call to RapidAPI, so this is deliberately small to stay well inside
// the free-tier monthly quota even if the page gets refreshed a lot.
const MAX_ODDS_LOOKUPS = 8;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST = "free-api-live-football-data.p.rapidapi.com";

  if (!RAPIDAPI_KEY) {
    return res.status(200).json({ matches: null, reason: "no_key" });
  }

  try {
    // This API expects YYYYMMDD (no dashes).
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const dateParam = `${yyyy}${mm}${dd}`;

    const cacheKey = `kp:matches:popular:${dateParam}`;
    const cached = await kv.get(cacheKey);
    if (cached) return res.status(200).json({ matches: cached, reason: null, cached: true });

    const apiRes = await fetch(
      `https://${RAPIDAPI_HOST}/football-get-matches-by-date?date=${dateParam}`,
      {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      }
    );

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error("Football API error", apiRes.status, text);
      return res.status(200).json({ matches: null, reason: `api_error_${apiRes.status}` });
    }

    const json = await apiRes.json();
    const rawMatches = json.response?.matches || [];

    // Keep only matches from the whitelisted "big" leagues, so the page shows
    // Premier League / Liga / Serie A / Bundesliga / Ligue 1 / UCL / UEL
    // instead of random lower divisions from anywhere in the world.
    const popular = rawMatches.filter((m) => POPULAR_LEAGUES[m.leagueId]);

    const matches = await Promise.all(
      popular.slice(0, 20).map(async (m, index) => {
        const base = {
          id: m.id,
          leagueId: m.leagueId,
          league: POPULAR_LEAGUES[m.leagueId] || "",
          homeId: m.home?.id,
          awayId: m.away?.id,
          home: m.home?.name,
          away: m.away?.name,
          time: m.time, // already formatted like "06.11.2024 21:00"
          finished: m.status?.halfs?.finished || false,
          odds: null,
        };

        // Only fetch odds for the first MAX_ODDS_LOOKUPS matches to protect
        // the RapidAPI free-tier quota.
        if (index >= MAX_ODDS_LOOKUPS) return base;

        try {
          // NOTE: endpoint name + "matchid" param reverse-engineered from the
          // RapidAPI playground on 26/08/2026 (only Bet365 odds are returned
          // by this API, no multi-bookmaker comparison). If this ever starts
          // returning errors, check the Vercel function logs the same way we
          // debugged the standings endpoint, then fix this one URL.
          const oddsRes = await fetch(
            `https://${RAPIDAPI_HOST}/football-get-match-odds?matchid=${m.id}`,
            {
              headers: {
                "x-rapidapi-key": RAPIDAPI_KEY,
                "x-rapidapi-host": RAPIDAPI_HOST,
              },
            }
          );
          if (oddsRes.ok) {
            const oddsJson = await oddsRes.json();
            const selections = oddsJson.response?.odds?.odds?.resolvedOddsMarket?.selections || [];
            if (selections.length === 3) {
              base.odds = {
                home: selections[0]?.oddsDecimal ?? null,
                draw: selections[1]?.oddsDecimal ?? null,
                away: selections[2]?.oddsDecimal ?? null,
                bookmaker: oddsJson.response?.odds?.persistentKey || "Bet365",
              };
            }
          }
        } catch (e) {
          // Odds are a bonus on top of the match list — never let a failed
          // odds lookup break the whole page.
          console.error("Odds lookup failed for match", m.id, e);
        }

        return base;
      })
    );

    // Cache 10 minutes: long enough to spare the API quota, short enough
    // that odds don't go too stale before kickoff.
    await kv.set(cacheKey, matches, { ex: 10 * 60 });

    return res.status(200).json({ matches, reason: null });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ matches: null, reason: "exception" });
  }
}
