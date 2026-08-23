// Vercel Serverless Function — fetches today's fixtures server-side to avoid
// CORS issues (many APIs, including API-Football, block direct browser calls).
// Set RAPIDAPI_KEY in Vercel -> Settings -> Environment Variables
// (no VITE_ prefix — this key now stays server-side only, which is also safer).

export default async function handler(req, res) {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST = "api-football-v1.p.rapidapi.com";

  if (!RAPIDAPI_KEY) {
    return res.status(200).json({ matches: null, reason: "no_key" });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    const apiRes = await fetch(
      `https://${RAPIDAPI_HOST}/v3/fixtures?date=${today}`,
      {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      }
    );

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error("API-Football error", apiRes.status, text);
      return res.status(200).json({ matches: null, reason: `api_error_${apiRes.status}` });
    }

    const json = await apiRes.json();

    const matches = (json.response || []).slice(0, 15).map((f) => ({
      id: f.fixture.id,
      league: f.league.name,
      leagueId: f.league.id,
      homeId: f.teams.home.id,
      awayId: f.teams.away.id,
      home: f.teams.home.name,
      away: f.teams.away.name,
      time: new Date(f.fixture.date).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    return res.status(200).json({ matches, reason: null });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ matches: null, reason: "exception" });
  }
}
