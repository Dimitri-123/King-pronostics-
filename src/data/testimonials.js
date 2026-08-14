// Generates a large, varied pool of short client-style messages used purely
// as scrolling social-proof content on the public site. These are NOT real
// user submissions — genuine messages typed by visitors are stored separately
// and never displayed publicly (see dashboard "messages" note).

const firstNames = [
  "Junior", "Bertrand", "Achille", "Steve", "Franck", "Yannick", "Landry",
  "Christian", "Aurelie", "Sandrine", "Patricia", "Vanessa", "Michelle",
  "Rodrigue", "Blaise", "Herve", "Cedric", "Armel", "Bruno", "Diane",
  "Larissa", "Prisca", "Emmanuel", "Ghislain", "Fabrice", "Merveille",
  "Stephane", "Arsene", "Guy", "Nadege",
];

const cities = [
  "Yaoundé", "Douala", "Bafoussam", "Garoua", "Bamenda", "Kribi",
  "Ebolowa", "Maroua", "Dschang", "Buea", "Ngaoundéré", "Limbe",
];

const amounts = [5000, 8000, 10000, 12500, 15000, 20000, 25000, 30000, 40000, 50000];

const openers = {
  fr: [
    "Encore un gain ce soir grâce au ticket de",
    "Fidèle depuis 3 mois, jamais déçu par",
    "J'ai douté au début mais",
    "Ticket validé en 20 minutes, j'ai touché",
    "Sérieux et ponctuel, je recommande",
    "Deuxième semaine consécutive avec",
    "Le pronostic était clair et ça a payé",
    "Rien à dire, le combiné est passé",
    "Client depuis le début, toujours du solide chez",
    "J'étais sceptique, j'ai testé et",
  ],
  en: [
    "Another win tonight thanks to the ticket from",
    "Loyal for 3 months, never disappointed by",
    "I doubted it at first but",
    "Ticket confirmed in 20 minutes, I won",
    "Reliable and on time, I recommend",
    "Second week in a row with",
    "The prediction was clear and it paid off",
    "Nothing to add, the combo hit",
    "Client since day one, always solid with",
    "I was skeptical, tried it and",
  ],
};

const closers = {
  fr: ["King Pronostics.", "cette équipe.", "leur travail.", "le service."],
  en: ["King Pronostics.", "this team.", "their work.", "the service."],
};

function seededPick(arr, seed) {
  return arr[seed % arr.length];
}

export function generateTestimonials(lang = "fr", count = 500) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const name = seededPick(firstNames, i * 7 + 1);
    const city = seededPick(cities, i * 3 + 2);
    const amount = seededPick(amounts, i * 5 + 3);
    const opener = seededPick(openers[lang], i * 11 + 4);
    const closer = seededPick(closers[lang], i * 13 + 5);
    const text =
      lang === "fr"
        ? `${opener} ${closer} +${amount.toLocaleString("fr-FR")} FCFA empochés.`
        : `${opener} ${closer} +${amount.toLocaleString("en-US")} XAF earned.`;
    list.push({
      id: `t-${i}`,
      name: `${name} ${city[0]}.`,
      city,
      text,
    });
  }
  return list;
}
