// Vercel Serverless Function — fetches upcoming real fixtures from
// "Free API Live Football Data" (RapidAPI), server-side to avoid CORS.
// Set RAPIDAPI_KEY in Vercel -> Settings -> Environment Variables.
//
// v6 (27/08/2026): confirmed the RapidAPI plan is a hard-capped 100
// requests/MONTH (not per day) — staying on the free tier per Mr OMB'S.
// Budget across the whole site (this file + api/football.js standings):
//   - matches-by-date: cached 24h  → ~30 calls/month
//   - odds (now a VIP-gated perk): capped at 1 lookup per refresh → ~30/month
//   - standings (api/football.js): cached 48h → ~15/month
//   Total ≈ 75/month, leaving ~25 of buffer for RapidAPI playground testing.
// Do not lower these cache durations without recalculating this budget —
// dropping any one of them back to a 10-20 min cache alone can blow the
// entire monthly quota within a single day (see the 429 outage on
// 26/08/2026 that took down both matches and standings at once).
//
// Also: odds are now only shown to VIP-unlocked visitors on the frontend
// (src/pages/Matches.jsx) — non-members see a "🔒 réservé aux membres VIP"
// teaser instead of the numbers. The fetch below still only pulls odds for
// MAX_ODDS_LOOKUPS matches regardless of who's viewing, since this is a
// shared server-side cache, not a per-visitor fetch.
//
// v5 (27/08/2026): fixed two issues found after a RapidAPI quota exhaustion
// (api_error_429) on 26/08/2026 made both this endpoint and standings go
// blank at the same time:
//  - Real fetch errors (429, 401, etc.) are now returned as
//    `reason: "api_error_XXX"` instead of being swallowed into a
//    misleadingly "successful" empty list — the frontend can now tell a
//    genuine quiet day apart from an outage.
//  - The multi-day fallback now stops immediately on a rate-limit instead of
//    burning more quota retrying days 2-3, and both successes and failures
//    are cached so page refreshes during an outage don't pile on more
//    failed requests.
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

// Max number of matches we'll fetch odds for per request. Kept at 1 to fit
// the confirmed 100 requests/month hard limit on the free RapidAPI plan —
// see the budget note in the file header before raising this.
const MAX_ODDS_LOOKUPS = 1;
// If today alone doesn't have at least this many upcoming popular-league
// matches, pull the following days too instead of showing an almost-empty
// section.
const MIN_MATCHES_BEFORE_FALLBACK = 6;
const MAX_DAYS_TO_CHECK = 3;
// A match kicked off this many minutes ago is considered finished/in the
// past and gets dropped from "upcoming popular matches".
const MATCH_DURATION_BUFFER_MIN = 130;
// Cache the fixture list for a full day — see the quota budget note above.
const MATCHES_CACHE_SECONDS = 24 * 60 * 60;
// Cache a failed/rate-limited response briefly so refreshes during an
// outage don't compound the problem.
const ERROR_CACHE_SECONDS = 2 * 60;

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

// Returns { matches, errorReason } — errorReason is set (and matches empty)
// as soon as RapidAPI refuses the request, so the caller can stop looping
// over more days instead of burning more quota on a request that's just
// going to fail the same way.
async function fetchMatchesForDate(dateParam, host, key) {
  const apiRes = await fetch(
    `https://${host}/football-get-matches-by-date?date=${dateParam}`,
    { headers: { "x-rapidapi-key": key, "x-rapidapi-host": host } }
  );
  if (!apiRes.ok) {
    console.error("Football API error", apiRes.status, await apiRes.text());
    return { matches: [], errorReason: `api_error_${apiRes.status}` };
  }
  const json = await apiRes.json();
  return { matches: json.response?.matches || [], errorReason: null };
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
    if (cached) return res.status(200).json({ ...cached, cached: true });

    let popular = [];
    let errorReason = null;
    for (let dayOffset = 0; dayOffset < MAX_DAYS_TO_CHECK; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() + dayOffset);
      const dateParam = formatDateParam(date);
      const { matches: rawMatches, errorReason: dayError } = await fetchMatchesForDate(dateParam, RAPIDAPI_HOST, RAPIDAPI_KEY);

      if (dayError) {
        // The API is refusing us (quota, auth, etc.) — stop immediately
        // instead of retrying the same failure for days 2 and 3.
        errorReason = dayError;
        break;
      }

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

    if (errorReason) {
      const payload = { matches: null, reason: errorReason };
      // Cache the failure briefly too — if RapidAPI is rate-limiting us,
      // hammering it again on every page load only digs the hole deeper.
      await kv.set(cacheKey, payload, { ex: ERROR_CACHE_SECONDS });
      return res.status(200).json(payload);
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

        // Only fetch odds for the first MAX_ODDS_LOOKUPS match(es) — kept at
        // 1 to fit the confirmed 100/month quota. This is now a VIP-gated
        // perk (see src/pages/Matches.jsx), so a single featured match with
        // real odds is enough; the rest simply show no odds box.
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

    const payload = { matches, reason: null };
    // Cache 24h — see the quota budget note in the file header. Don't lower
    // this without recalculating the monthly request math.
    await kv.set(cacheKey, payload, { ex: MATCHES_CACHE_SECONDS });

    return res.status(200).json(payload);
  } catch (err) {
    console.error(err);
    return res.status(200).json({ matches: null, reason: "exception" });
  }
}

