// matchesToday and prognosticsToday used to live here as placeholder data.
// Both are now generated live from the real "Matchs populaires du jour"
// feed (see api/matches.js + src/pages/Matches.jsx and Prognostics.jsx) —
// no more fake teams/success rates to keep in sync by hand.

// "rating" is out of 10, shown as a score + progress bar.
// "badgeBg"/"badgeColor" style the brand chip (no logo images used — this
// project has no image assets for bookmakers, so each brand gets a colored
// text chip echoing its real brand colors instead).
// "tags" are short trust badges shown under the bonus box.
// "highlight: true" marks the #1 pick with the gold outline treatment.
export const promoCodes = [
  {
    platform: "Melbet",
    rating: 9.5,
    code: "KINGMB1",
    bonus: "200%",
    bonusDetail: "jusqu'à 100 000 FCFA sur le 1er dépôt",
    url: "https://melbet.com",
    badgeBg: "#111111",
    badgeColor: "#F2B705",
    tags: ["Validé par notre équipe", "Offre en cours", "Sélection King Pronostics"],
    highlight: true,
  },
  {
    platform: "1xBet",
    rating: 9.0,
    code: "KING1X",
    bonus: "200%",
    bonusDetail: "jusqu'à 50 000 FCFA sur le 1er dépôt",
    url: "https://1xbet.com",
    badgeBg: "#0057FF",
    badgeColor: "#FFFFFF",
    tags: ["Validé par notre équipe", "Offre en cours"],
  },
  {
    platform: "888Starz",
    rating: 9.0,
    code: "KING888",
    bonus: "230%",
    bonusDetail: "sur le 1er dépôt, jusqu'à 500 000 FCFA",
    url: "https://888starz.bet",
    badgeBg: "#D91E2A",
    badgeColor: "#FFFFFF",
    tags: ["Validé par notre équipe", "Offre en cours"],
  },
  {
    platform: "1Win",
    rating: 9.0,
    code: "KING1WIN",
    bonus: "500%",
    bonusDetail: "répartis sur les 4 premiers dépôts",
    url: "https://1win.com",
    badgeBg: "#0B0B0B",
    badgeColor: "#FFFFFF",
    tags: ["Validé par notre équipe", "Offre en cours"],
  },
  {
    platform: "Linebet",
    rating: 8.5,
    code: "KINGLINE",
    bonus: "100%",
    bonusDetail: "sur le 1er dépôt",
    url: "https://linebet.com",
    badgeBg: "#00A651",
    badgeColor: "#FFFFFF",
    tags: ["Validé par notre équipe", "Offre en cours"],
  },
  {
    platform: "PremierBet",
    rating: 8.5,
    code: "KINGPB",
    bonus: "200%",
    bonusDetail: "sur le 1er dépôt",
    url: "https://premierbet.com",
    badgeBg: "#009444",
    badgeColor: "#FFFFFF",
    tags: ["Validé par notre équipe", "Offre en cours"],
  },
  {
    platform: "Paripesa",
    rating: 8.5,
    code: "KINGPARI",
    bonus: "130%",
    bonusDetail: "sur le 1er dépôt",
    url: "https://paripesa.com",
    badgeBg: "#0033A0",
    badgeColor: "#FFFFFF",
    tags: ["Validé par notre équipe", "Offre en cours"],
  },
  {
    platform: "BetPawa",
    rating: 8.5,
    code: null,
    bonus: "Freebet",
    bonusDetail: "pari gratuit à l'inscription",
    url: "https://betpawa.cm",
    badgeBg: "#FF6A13",
    badgeColor: "#FFFFFF",
    tags: ["Validé par notre équipe", "Populaire au Cameroun"],
  },
  {
    platform: "Betwinner",
    rating: 8.0,
    code: "KINGBW",
    bonus: "200%",
    bonusDetail: "sur le 1er dépôt",
    url: "https://betwinner.com",
    badgeBg: "#173C1F",
    badgeColor: "#7CFC8C",
    tags: ["Validé par notre équipe", "Offre en cours"],
  },
  {
    platform: "Stake",
    rating: 8.0,
    code: "KINGSTAKE",
    bonus: "200%",
    bonusDetail: "sur le 1er dépôt (paris crypto)",
    url: "https://stake.com",
    badgeBg: "#000000",
    badgeColor: "#FFFFFF",
    tags: ["Validé par notre équipe", "Offre en cours"],
  },
  {
    platform: "Bet365",
    rating: 8.0,
    code: null,
    bonus: "100%",
    bonusDetail: "sur le 1er dépôt",
    url: "https://bet365.com",
    badgeBg: "#00693E",
    badgeColor: "#FFFFFF",
    tags: ["Validé par notre équipe", "Fournisseur de nos cotes"],
  },
  {
    platform: "22Bet",
    rating: 7.5,
    code: "KING22",
    bonus: "200%",
    bonusDetail: "jusqu'à 60 000 FCFA sur le 1er dépôt",
    url: "https://22bet.com",
    badgeBg: "#0E7C7B",
    badgeColor: "#FFFFFF",
    tags: ["Validé par notre équipe", "Offre en cours"],
  },
];

export const ticketGallery = [
  { id: "g1", status: "won", caption: "Combiné 3 matchs — validé", timestamp: "Aujourd'hui, 14:02", imageUrl: null },
  { id: "g2", status: "pending", caption: "Ticket du soir — en cours", timestamp: "Aujourd'hui, 12:40", imageUrl: null },
  { id: "g3", status: "won", caption: "Simple Real Madrid — validé", timestamp: "Hier, 22:10", imageUrl: null },
  { id: "g4", status: "waiting", caption: "Ticket de demain — en attente", timestamp: "Aujourd'hui, 09:15", imageUrl: null },
];

export const TICKET_PRICE = 2000;
export const RECEIVING_FEE = 100;
