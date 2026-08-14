// Calls our own server-side /api/matches endpoint (not RapidAPI directly)
// to avoid browser CORS restrictions. See api/matches.js.

export async function fetchTodayFixtures() {
  try {
    const res = await fetch("/api/matches");
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.matches || data.matches.length === 0) {
      if (data.reason) console.warn("Fixtures unavailable:", data.reason);
      return null;
    }
    return data.matches;
  } catch (err) {
    console.error("fetchTodayFixtures failed", err);
    return null;
  }
}
