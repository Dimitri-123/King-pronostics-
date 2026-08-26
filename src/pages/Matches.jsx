import { useEffect, useState } from "react";
import { useLang } from "../context/LangContext";
import { promoCodes } from "../data/mockData";
import { fetchTodayFixtures } from "../lib/footballApi";
import { isVipUnlockedToday, unlockVipToday } from "../lib/vip";
import PaymentModal from "../components/PaymentModal";

const PREMIER_LEAGUE_ID = 47;

export default function Matches() {
  const { t, lang } = useLang();
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesReason, setMatchesReason] = useState(null);

  const [predictions, setPredictions] = useState(null);
  const [unlocked, setUnlocked] = useState(isVipUnlockedToday());
  const [showPayment, setShowPayment] = useState(false);

  const [standings, setStandings] = useState(null);
  const [standingsLoading, setStandingsLoading] = useState(true);

  useEffect(() => {
    fetchTodayFixtures().then((data) => {
      setMatches(data?.matches || []);
      setMatchesReason(data?.reason || null);
      setMatchesLoading(false);
    });

    fetch(`/api/football?type=standings&league=${PREMIER_LEAGUE_ID}`)
      .then((r) => r.json())
      .then((d) => setStandings(d.standings))
      .catch(() => setStandings(null))
      .finally(() => setStandingsLoading(false));
  }, []);

  useEffect(() => {
    if (unlocked) loadPredictions();
  }, [unlocked]);

  function loadPredictions() {
    fetch("/api/football?type=predictions")
      .then((r) => r.json())
      .then((d) => setPredictions(d.predictions))
      .catch(() => setPredictions(null));
  }

  return (
    <div style={{ background: "var(--paper)" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, #F3EFE3, var(--paper))", padding: "40px 0 32px" }}>
        <div className="container">
          <div className="eyebrow">{t.nav.matches}</div>
          <h1 style={{ fontSize: 34, marginTop: 8 }}>{t.nav.matches}</h1>
          <p style={{ color: "var(--muted)", marginTop: 8, maxWidth: 520 }}>
            {lang === "fr"
              ? "Les vrais matchs du jour, le classement en direct, et nos prédictions VIP réservées aux membres."
              : "Today's real matches, live standings, and our VIP predictions reserved for members."}
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: "32px 24px 64px" }}>

        {/* Today's real matches */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeader
            emoji="⚽"
            title={lang === "fr" ? "Matchs populaires du jour" : "Today's popular matches"}
          />
          <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: -8, marginBottom: 18 }}>
            {lang === "fr"
              ? "Premier League, Liga, Serie A, Bundesliga, Ligue 1, C1 et C3 — cotes 1N2 fournies par Bet365 à titre indicatif."
              : "Premier League, Liga, Serie A, Bundesliga, Ligue 1, UCL and UEL — 1X2 odds shown are from Bet365 and for reference only."}
          </p>

          {matchesLoading && <SpinnerRow />}

          {!matchesLoading && matches.length === 0 && (
            <div className="card" style={{ padding: 20, textAlign: "center" }}>
              <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0 }}>
                {lang === "fr" ? "Aucun match trouvé pour aujourd'hui." : "No matches found for today."}
              </p>
            </div>
          )}

          {!matchesLoading && matches.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {matches.map((m) => (
                <div key={m.id} className="card" style={{ padding: 16 }}>
                  {m.league && (
                    <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gold)", fontWeight: 700, marginBottom: 6 }}>
                      {m.league}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.4 }}>
                      {m.home}
                      <span style={{ color: "var(--muted)", fontWeight: 400 }}> vs </span>
                      {m.away}
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{m.time}</span>
                    {m.finished ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--forest)", background: "var(--gold-soft)", padding: "3px 9px", borderRadius: 999 }}>
                        {lang === "fr" ? "Terminé" : "Finished"}
                      </span>
                    ) : (
                      <span className="status-dot status-pending" />
                    )}
                  </div>
                  {m.odds && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                      <OddBox label="1" value={m.odds.home} />
                      <OddBox label="N" value={m.odds.draw} />
                      <OddBox label="2" value={m.odds.away} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* VIP predictions */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeader emoji="👑" title={lang === "fr" ? "Prédictions VIP du jour" : "Today's VIP predictions"} gold />
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: -8, marginBottom: 18 }}>
            {lang === "fr"
              ? "Incluses avec votre Ticket VIP — le même paiement débloque tout."
              : "Included with your VIP Ticket — the same payment unlocks everything."}
          </p>

          {!unlocked && (
            <div className="card" style={{ padding: "32px 24px", textAlign: "center", border: "1px dashed var(--gold)", background: "var(--gold-soft)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
              <p style={{ fontSize: 14, color: "var(--forest-deep)", marginBottom: 18, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
                {lang === "fr"
                  ? "Débloquez les prédictions officielles de nos algorithmes pour tous les matchs du jour."
                  : "Unlock our algorithm's official predictions for all of today's matches."}
              </p>
              <button onClick={() => setShowPayment(true)} className="btn btn-gold">
                👑 {lang === "fr" ? "Débloquer (2100 FCFA)" : "Unlock (2100 FCFA)"}
              </button>
            </div>
          )}

          {unlocked && !predictions && <SpinnerRow />}

          {unlocked && predictions && predictions.length === 0 && (
            <div className="card" style={{ padding: 20, textAlign: "center" }}>
              <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0 }}>
                {lang === "fr" ? "Aucune prédiction disponible pour l'instant." : "No predictions available right now."}
              </p>
            </div>
          )}

          {unlocked && predictions && predictions.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {predictions.map((p) => (
                <div key={p.id} className="card" style={{ padding: 16, borderColor: "var(--gold)" }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{p.home} vs {p.away}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 10, fontFamily: "var(--font-mono)" }}>{p.date}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ background: "var(--gold-soft)", color: "var(--gold)", fontWeight: 700, padding: "5px 12px", borderRadius: 6, fontSize: 13 }}>
                      {lang === "fr" ? "Pronostic" : "Pick"}: {p.prediction}
                    </span>
                    {p.probability != null && (
                      <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{p.probability}%</span>
                    )}
                  </div>
                  {p.finished && (
                    <p style={{ fontSize: 11.5, marginTop: 10, marginBottom: 0, fontWeight: 700, color: p.wasCorrect ? "var(--forest)" : "var(--danger)" }}>
                      {p.wasCorrect ? "✓ " : "✗ "}{p.resultScore}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Standings */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeader emoji="📊" title={lang === "fr" ? "Classement — Premier League" : "Standings — Premier League"} />

          {standingsLoading && <SpinnerRow />}

          {!standingsLoading && standings && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 620 }}>
                  <thead>
                    <tr style={{ background: "var(--paper)", textAlign: "left" }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>{lang === "fr" ? "Équipe" : "Team"}</th>
                      <th style={thStyle} title={lang === "fr" ? "Matchs joués" : "Matches played"}>
                        {lang === "fr" ? "Joués" : "Played"}
                      </th>
                      <th style={thStyle} title={lang === "fr" ? "Matchs gagnés" : "Matches won"}>
                        {lang === "fr" ? "Gagnés" : "Won"}
                      </th>
                      <th style={thStyle} title={lang === "fr" ? "Matchs nuls" : "Matches drawn"}>
                        {lang === "fr" ? "Nuls" : "Drawn"}
                      </th>
                      <th style={thStyle} title={lang === "fr" ? "Matchs perdus" : "Matches lost"}>
                        {lang === "fr" ? "Perdus" : "Lost"}
                      </th>
                      <th style={thStyle} title={lang === "fr" ? "Différence de buts" : "Goal difference"}>
                        {lang === "fr" ? "Diff." : "Diff."}
                      </th>
                      <th style={thStyle} title={lang === "fr" ? "Points au classement" : "League points"}>
                        {lang === "fr" ? "Points" : "Points"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row, i) => {
                      const diff = row.goalsDiff;
                      const diffLabel = diff > 0 ? `+${diff}` : `${diff}`;
                      const diffColor = diff > 0 ? "var(--forest)" : diff < 0 ? "var(--danger)" : "var(--muted)";
                      return (
                        <tr key={row.team} style={{ borderTop: "1px solid var(--line)", background: i < 4 ? "rgba(27,67,50,0.04)" : "transparent" }}>
                          <td style={tdStyle}>{row.rank}</td>
                          <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: "nowrap" }}>{row.team}</td>
                          <td style={tdStyle}>{row.played}</td>
                          <td style={tdStyle}>{row.win}</td>
                          <td style={tdStyle}>{row.draw}</td>
                          <td style={tdStyle}>{row.lose}</td>
                          <td style={{ ...tdStyle, fontWeight: 600, color: diffColor }}>
                            {diff == null ? "—" : diffLabel}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: "var(--forest)" }}>{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!standingsLoading && !standings && (
            <div className="card" style={{ padding: 20, textAlign: "center" }}>
              <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0 }}>
                {lang === "fr" ? "Classement indisponible pour l'instant." : "Standings unavailable right now."}
              </p>
            </div>
          )}
        </section>

        {/* Promo codes — ranked bookmaker list */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeader emoji="🎁" title={t.footer.promoTitle} />
          <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: -8, marginBottom: 18 }}>
            {lang === "fr"
              ? "18+ · Contenu publicitaire · Jouer comporte des risques."
              : "18+ · Advertising content · Gambling involves risk."}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 620 }}>
            {promoCodes.map((p, i) => (
              <BookmakerCard key={p.platform} rank={i + 1} data={p} lang={lang} />
            ))}
          </div>
        </section>

        {/* Bonus types explainer */}
        <section>
          <SectionHeader emoji="📘" title={lang === "fr" ? "Comprendre les bonus bookmakers" : "Understanding bookmaker bonuses"} />
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: -8, marginBottom: 18, maxWidth: 620 }}>
            {lang === "fr"
              ? "Trois grandes familles de bonus reviennent chez la plupart des bookmakers. Voici comment les reconnaître avant de vous inscrire."
              : "Most bookmakers rely on three main types of welcome bonus. Here's how to spot each one before you sign up."}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {bonusTypes(lang).map((b) => (
              <div key={b.title} className="card" style={{ padding: 18 }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{b.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{b.title}</div>
                <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>{b.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          itemLabel={lang === "fr" ? "Prédictions VIP" : "VIP predictions"}
          onSuccess={() => {
            unlockVipToday();
            setUnlocked(true);
          }}
        />
      )}
    </div>
  );
}

function BookmakerCard({ rank, data, lang }) {
  const { platform, rating, bonus, code, url, tags, highlight } = data;
  const [copied, setCopied] = useState(false);

  function handleCopy(e) {
    e.preventDefault();
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div
      className="card"
      style={{
        position: "relative",
        padding: "20px 20px 18px",
        border: highlight ? "1.5px solid var(--gold)" : undefined,
      }}
    >
      {highlight && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: 18,
            background: "var(--forest)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.04em",
            padding: "4px 12px",
            borderRadius: 999,
          }}
        >
          {lang === "fr" ? "Bookmaker n°1" : "Top bookmaker"}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "var(--forest-deep)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}
          >
            {rank}
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19 }}>
            {platform}
          </div>
        </div>
        {rating != null && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--forest)" }}>
              {rating.toFixed(1)}<span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>/10</span>
            </div>
            <div style={{ width: 60, height: 4, background: "var(--line)", borderRadius: 999, marginTop: 3, overflow: "hidden" }}>
              <div style={{ width: `${rating * 10}%`, height: "100%", background: "var(--gold)" }} />
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 14,
          background: "var(--gold-soft)",
          borderRadius: 10,
          padding: "10px 14px",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--forest-deep)", marginRight: 6 }}>
          {lang === "fr" ? "Bonus" : "Bonus"} :
        </span>
        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--gold)" }}>{bonus}</span>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>
        {(tags || []).map((tag) => (
          <li key={tag} style={{ fontSize: 13, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--forest)" }}>✓</span> {tag}
          </li>
        ))}
      </ul>

      {code && (
        <button
          onClick={handleCopy}
          style={{
            marginTop: 14, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "var(--paper)", border: "1.5px dashed var(--line)", borderRadius: 8,
            padding: "9px 14px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink)",
          }}
        >
          <span>
            <span style={{ color: "var(--muted)", marginRight: 8 }}>
              {lang === "fr" ? "Code promo" : "Promo code"}
            </span>
            {code}
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: copied ? "var(--forest)" : "var(--gold)" }}>
            {copied ? (lang === "fr" ? "Copié !" : "Copied!") : (lang === "fr" ? "Copier" : "Copy")}
          </span>
        </button>
      )}

      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="btn btn-gold"
        style={{ marginTop: 14, width: "100%" }}
      >
        {lang === "fr" ? "Obtenir le bonus" : "Claim the bonus"} ↗
      </a>
    </div>
  );
}

function OddBox({ label, value }) {
  return (
    <div style={{ textAlign: "center", background: "var(--paper)", borderRadius: 8, padding: "6px 4px" }}>
      <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--forest)", fontFamily: "var(--font-mono)" }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

function bonusTypes(lang) {
  if (lang === "fr") {
    return [
      {
        emoji: "↩️",
        title: "Le pari remboursé",
        text: "Votre toute première mise vous est rendue (souvent en freebet) si elle est perdante — une façon de démarrer sans risque sur ce premier pari.",
      },
      {
        emoji: "🎟️",
        title: "Le pari gratuit",
        text: "Le bookmaker vous offre directement un pari gratuit à l'inscription, sans condition de mise préalable — les gains éventuels sont à vous.",
      },
      {
        emoji: "💰",
        title: "Le bonus de dépôt",
        text: "Votre premier dépôt est doublé (ou plus) par le bookmaker, ce qui vous donne davantage de budget à miser dès vos premiers tickets.",
      },
    ];
  }
  return [
    {
      emoji: "↩️",
      title: "Refunded bet",
      text: "Your very first stake is returned (often as a freebet) if it loses — a risk-free way to place that first bet.",
    },
    {
      emoji: "🎟️",
      title: "Free bet",
      text: "The bookmaker hands you a free bet on sign-up, no prior losing bet required — any winnings are yours to keep.",
    },
    {
      emoji: "💰",
      title: "Deposit bonus",
      text: "Your first deposit gets matched (or more) by the bookmaker, giving you extra budget to stake on your first tickets.",
    },
  ];
}

function SectionHeader({ emoji, title, gold }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <h2 style={{ fontSize: 20, color: gold ? "var(--gold)" : "var(--ink)" }}>{title}</h2>
    </div>
  );
}

function SpinnerRow() {
  return (
    <div style={{ padding: "24px 0", display: "flex", justifyContent: "center" }}>
      <div className="spinner" />
    </div>
  );
}

const thStyle = { padding: "10px 12px", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)" };
const tdStyle = { padding: "9px 12px" };
