// Calls our own server-side /api/matches endpoint (not RapidAPI directly)
// to avoid browser CORS restrictions. See api/matches.js.

export async function fetchTodayFixtures() {
  try {
    const res = await fetch("/api/matches");
    if (!res.ok) return { matches: [], reason: `http_${res.status}` };
    const data = await res.json();
    return { matches: data.matches || [], reason: data.reason || null };
  } catch (err) {
    console.error("fetchTodayFixtures failed", err);
    return { matches: [], reason: "exception" };
  }
}
