// Vercel Serverless Function — fetches today's real fixtures from
// "Free API Live Football Data" (RapidAPI), server-side to avoid CORS.
// Set RAPIDAPI_KEY in Vercel -> Settings -> Environment Variables.

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

    const matches = rawMatches.slice(0, 20).map((m) => ({
      id: m.id,
      leagueId: m.leagueId,
      league: m.tournamentStage || "", // this API doesn't return a clean league name here
      homeId: m.home?.id,
      awayId: m.away?.id,
      home: m.home?.name,
      away: m.away?.name,
      time: m.time, // already formatted like "06.11.2024 21:00"
      finished: m.status?.halfs?.finished || false,
    }));

    return res.status(200).json({ matches, reason: null });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ matches: null, reason: "exception" });
  }
}
