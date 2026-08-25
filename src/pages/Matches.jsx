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
            title={lang === "fr" ? "Matchs du jour" : "Today's matches"}
          />

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
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--paper)", textAlign: "left" }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>{lang === "fr" ? "Équipe" : "Team"}</th>
                    <th style={thStyle}>J</th>
                    <th style={thStyle}>{lang === "fr" ? "V" : "W"}</th>
                    <th style={thStyle}>N</th>
                    <th style={thStyle}>{lang === "fr" ? "D" : "L"}</th>
                    <th style={thStyle}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, i) => (
                    <tr key={row.team} style={{ borderTop: "1px solid var(--line)", background: i < 4 ? "rgba(27,67,50,0.04)" : "transparent" }}>
                      <td style={tdStyle}>{row.rank}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{row.team}</td>
                      <td style={tdStyle}>{row.played}</td>
                      <td style={tdStyle}>{row.win}</td>
                      <td style={tdStyle}>{row.draw}</td>
                      <td style={tdStyle}>{row.lose}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: "var(--forest)" }}>{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

        {/* Promo codes */}
        <section>
          <SectionHeader emoji="🎁" title={t.footer.promoTitle} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 14 }}>
            {promoCodes.map((p) => (
              <a key={p.platform} href={p.url} target="_blank" rel="noreferrer" className="card" style={{ padding: 18, display: "block" }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{p.platform}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{p.bonus}</div>
                {p.code !== "—" && (
                  <div style={{ marginTop: 10, display: "inline-block", background: "var(--gold-soft)", color: "var(--gold)", fontFamily: "var(--font-mono)", fontSize: 12, padding: "4px 10px", borderRadius: 6 }}>
                    {p.code}
                  </div>
                )}
              </a>
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
