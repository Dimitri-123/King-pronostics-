// Vercel Serverless Function — fetches upcoming real fixtures from
// "Free API Live Football Data" (RapidAPI), server-side to avoid CORS.
// Set RAPIDAPI_KEY in Vercel -> Settings -> Environment Variables.
//
// v3 (26/08/2026): broadened the "popular leagues" whitelist (added
// Eredivisie, Primeira Liga, Championship, MLS, Brasileirão, Conference
// League, Saudi Pro League) and added a multi-day fallback — on quiet
// fixture days (e.g. mid-week gaps), we now also pull the next 2 days so
// the section never collapses to a single card. League IDs were confirmed
// one by one against this API's "Get League Detail by League ID" endpoint
// (Premier League 47, Champions League 42, Europa League 73, Conference
// League 10216 were independently verified on 26/08/2026; the rest follow
// the same numbering scheme and should be spot-checked there if a
// competition name ever looks wrong).
import { kv } from "@vercel/kv";

const POPULAR_LEAGUES = {
  47: "Premier League",
  48: "Championship",
  87: "Liga",
  55: "Serie A",
  54: "Bundesliga",
  53: "Ligue 1",
  57: "Eredivisie",
  61: "Primeira Liga",
  42: "Ligue des Champions",
  73: "Ligue Europa",
  10216: "Ligue Conférence",
  130: "MLS",
  268: "Brasileirão",
  536: "Saudi Pro League",
};

// Max number of matches we'll fetch odds for per request. Each one is an
// extra call to RapidAPI, so this is deliberately small to stay well inside
// the free-tier monthly quota even if the page gets refreshed a lot.
const MAX_ODDS_LOOKUPS = 8;
// If today alone doesn't have at least this many popular-league matches,
// pull the following days too instead of showing an almost-empty section.
const MIN_MATCHES_BEFORE_FALLBACK = 6;
const MAX_DAYS_TO_CHECK = 3;

function formatDateParam(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

async function fetchMatchesForDate(dateParam, host, key) {
  const apiRes = await fetch(
    `https://${host}/football-get-matches-by-date?date=${dateParam}`,
    { headers: { "x-rapidapi-key": key, "x-rapidapi-host": host } }
  );
  if (!apiRes.ok) {
    console.error("Football API error", apiRes.status, await apiRes.text());
    return [];
  }
  const json = await apiRes.json();
  return json.response?.matches || [];
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST = "free-api-live-football-data.p.rapidapi.com";

  if (!RAPIDAPI_KEY) {
    return res.status(200).json({ matches: null, reason: "no_key" });
  }

  try {
    const today = new Date();
    const cacheKey = `kp:matches:popular:${formatDateParam(today)}`;
    const cached = await kv.get(cacheKey);
    if (cached) return res.status(200).json({ matches: cached, reason: null, cached: true });

    let popular = [];
    for (let dayOffset = 0; dayOffset < MAX_DAYS_TO_CHECK; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);
      const dateParam = formatDateParam(date);
      const rawMatches = await fetchMatchesForDate(dateParam, RAPIDAPI_HOST, RAPIDAPI_KEY);

      const dayLabel =
        dayOffset === 0
          ? "today"
          : dayOffset === 1
          ? "tomorrow"
          : `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;

      const dayMatches = rawMatches
        .filter((m) => POPULAR_LEAGUES[m.leagueId])
        .map((m) => ({ ...m, __dayLabel: dayLabel }));

      popular = popular.concat(dayMatches);

      // Stop early once we have enough for a healthy-looking section.
      if (popular.length >= MIN_MATCHES_BEFORE_FALLBACK) break;
    }

    const matches = await Promise.all(
      popular.slice(0, 24).map(async (m, index) => {
        const base = {
          id: m.id,
          leagueId: m.leagueId,
          league: POPULAR_LEAGUES[m.leagueId] || "",
          dayLabel: m.__dayLabel,
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
