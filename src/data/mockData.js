// Placeholder data. Replace matches[] with a live API-Football fetch
// (see src/lib/footballApi.js) once your RapidAPI key is wired up.

export const matchesToday = [
  { id: 1, league: "Premier League", home: "Arsenal", away: "Chelsea", time: "17:00", oddHome: 2.1, oddDraw: 3.4, oddAway: 3.2 },
  { id: 2, league: "Ligue 1", home: "PSG", away: "Marseille", time: "20:00", oddHome: 1.6, oddDraw: 4.0, oddAway: 5.5 },
  { id: 3, league: "Liga", home: "Real Madrid", away: "Sevilla", time: "21:00", oddHome: 1.4, oddDraw: 4.8, oddAway: 7.0 },
  { id: 4, league: "Serie A", home: "Inter", away: "Juventus", time: "19:45", oddHome: 2.3, oddDraw: 3.2, oddAway: 3.0 },
  { id: 5, league: "Bundesliga", home: "Bayern", away: "Dortmund", time: "18:30", oddHome: 1.5, oddDraw: 4.5, oddAway: 6.0 },
];

export const promoCodes = [
  { platform: "1xBet", code: "KING1X", bonus: "100% jusqu'à 50 000 FCFA", url: "https://1xbet.com" },
  { platform: "Melbet", code: "KINGMB", bonus: "100% jusqu'à 40 000 FCFA", url: "https://melbet.com" },
  { platform: "BetPawa", code: "—", bonus: "Pari gratuit à l'inscription", url: "https://betpawa.cm" },
];

export const ticketGallery = [
  { id: "g1", status: "won", caption: "Combiné 3 matchs — validé", timestamp: "Aujourd'hui, 14:02", imageUrl: null },
  { id: "g2", status: "pending", caption: "Ticket du soir — en cours", timestamp: "Aujourd'hui, 12:40", imageUrl: null },
  { id: "g3", status: "won", caption: "Simple Real Madrid — validé", timestamp: "Hier, 22:10", imageUrl: null },
  { id: "g4", status: "waiting", caption: "Ticket de demain — en attente", timestamp: "Aujourd'hui, 09:15", imageUrl: null },
];

export const prognosticsToday = [
  {
    id: "p1",
    championship: "Premier League",
    teamA: "Arsenal",
    teamB: "Chelsea",
    successRate: 87,
    buyers: 63,
    expiresAt: "17:00",
    isNew: true,
  },
  {
    id: "p2",
    championship: "Liga",
    teamA: "Real Madrid",
    teamB: "Sevilla",
    successRate: 91,
    buyers: 41,
    expiresAt: "21:00",
    isNew: false,
  },
];

export const TICKET_PRICE = 2000;
export const RECEIVING_FEE = 100;
