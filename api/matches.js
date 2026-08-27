// Vercel Serverless Function — fetches upcoming real fixtures from
// "Free API Live Football Data" (RapidAPI), server-side to avoid CORS.
// Set RAPIDAPI_KEY in Vercel -> Settings -> Environment Variables.
//
// v4 (26/08/2026):
//  - Only returns matches that haven't kicked off yet (no more stale
//    "Terminé" cards sitting in "Matchs populaires du jour").
//  - Fixed the odds call: the real endpoint is
//    /football-event-odds?eventid=...&countrycode=CM (confirmed against the
//    RapidAPI playground on 26/08/2026). countrycode=CM returns
//    Melbet_Cameroon odds in XAF — much more relevant than the Bet365/BRL
//    odds the demo defaulted to. NOTE: the API's own promoText/callToAction
//    links are that provider's own affiliate tracking, not ours — we only
//    read the odds numbers from this response, never that link.
//  - Attaches a predictable league logo URL (no extra API call needed —
//    confirmed the pattern .../leaguelogo/dark/{leagueId}.png works for any
//    league ID on 26/08/2026).
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

function leagueLogo(leagueId) {
  return `https://images.fotmob.com/image_resources/logo/leaguelogo/dark/${leagueId}.png`;
}

// Max number of matches we'll fetch odds for per request. Each one is an
// extra call to RapidAPI, so this is deliberately small to stay well inside
// the free-tier monthly quota even if the page gets refreshed a lot.
const MAX_ODDS_LOOKUPS = 8;
// If today alone doesn't have at least this many upcoming popular-league
// matches, pull the following days too instead of showing an almost-empty
// section.
const MIN_MATCHES_BEFORE_FALLBACK = 6;
const MAX_DAYS_TO_CHECK = 3;
// A match kicked off this many minutes ago is considered finished/in the
// past and gets dropped from "upcoming popular matches".
const MATCH_DURATION_BUFFER_MIN = 130;

function formatDateParam(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

// This API returns "time" as "DD.MM.YYYY HH:mm" — parse it into a real Date
// so we can tell whether a match has already kicked off.
function parseKickoff(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, dd, mm, yyyy, hh, min] = match;
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00`);
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
    const now = new Date();
    const cacheKey = `kp:matches:upcoming:${formatDateParam(now)}`;
    const cached = await kv.get(cacheKey);
    if (cached) return res.status(200).json({ matches: cached, reason: null, cached: true });

    let popular = [];
    for (let dayOffset = 0; dayOffset < MAX_DAYS_TO_CHECK; dayOffset++) {
      const date = new Date(now);
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
        .filter((m) => {
          const kickoff = parseKickoff(m.time);
          if (!kickoff) return true; // keep if we can't parse the time, rather than silently drop it
          const minutesSinceKickoff = (now - kickoff) / 60000;
          return minutesSinceKickoff < MATCH_DURATION_BUFFER_MIN;
        })
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
          leagueLogo: leagueLogo(m.leagueId),
          dayLabel: m.__dayLabel,
          homeId: m.home?.id,
          awayId: m.away?.id,
          home: m.home?.name,
          away: m.away?.name,
          time: m.time, // "DD.MM.YYYY HH:mm"
          odds: null,
        };

        // Only fetch odds for the first MAX_ODDS_LOOKUPS matches to protect
        // the RapidAPI free-tier quota.
        if (index >= MAX_ODDS_LOOKUPS) return base;

        try {
          const oddsRes = await fetch(
            `https://${RAPIDAPI_HOST}/football-event-odds?eventid=${m.id}&countrycode=CM`,
            {
              headers: {
                "x-rapidapi-key": RAPIDAPI_KEY,
                "x-rapidapi-host": RAPIDAPI_HOST,
              },
            }
          );
          if (oddsRes.ok) {
            const oddsJson = await oddsRes.json();
            const oddsBlock = oddsJson.response?.odds;
            const selections = oddsBlock?.odds?.resolvedOddsMarket?.selections || [];
            if (selections.length === 3) {
              // persistentKey looks like "Melbet_Cameroon" — keep just the
              // bookmaker name for display.
              const bookmaker = (oddsBlock?.persistentKey || "Melbet_Cameroon").split("_")[0];
              base.odds = {
                home: selections[0]?.oddsDecimal ?? null,
                draw: selections[1]?.oddsDecimal ?? null,
                away: selections[2]?.oddsDecimal ?? null,
                bookmaker,
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
    // that odds/kickoff filtering don't go too stale.
    await kv.set(cacheKey, matches, { ex: 10 * 60 });

    return res.status(200).json({ matches, reason: null });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ matches: null, reason: "exception" });
  }
}
