import { useEffect, useState } from "react";
import { useLang } from "../context/LangContext";
import { matchesToday, promoCodes } from "../data/mockData";
import { fetchTodayFixtures } from "../lib/footballApi";
import { isVipUnlockedToday, unlockVipToday } from "../lib/vip";
import PaymentModal from "../components/PaymentModal";

const KNOWN_LEAGUES = {
  "Premier League": 39,
  "Ligue 1": 61,
  "La Liga": 140,
  "Serie A": 135,
  "Bundesliga": 78,
};

export default function Matches() {
  const { t, lang } = useLang();
  const [matches, setMatches] = useState(matchesToday);
  const [expandedId, setExpandedId] = useState(null);
  const [analysisCache, setAnalysisCache] = useState({});
  const [unlocked, setUnlocked] = useState(isVipUnlockedToday());
  const [showPayment, setShowPayment] = useState(false);
  const [standingsLeague, setStandingsLeague] = useState(null);
  const [standings, setStandings] = useState(null);
  const [standingsLoading, setStandingsLoading] = useState(false);

  useEffect(() => {
    fetchTodayFixtures().then((live) => {
      if (live && live.length) setMatches(live);
    });
  }, []);

  const availableLeagues = [...new Set(matches.map((m) => m.league))].filter(
    (name) => KNOWN_LEAGUES[name]
  );

  useEffect(() => {
    if (!standingsLeague && availableLeagues.length > 0) {
      setStandingsLeague(availableLeagues[0]);
    }
  }, [matches]);

  useEffect(() => {
    if (!standingsLeague) return;
    const leagueId = KNOWN_LEAGUES[standingsLeague];
    if (!leagueId) return;
    setStandingsLoading(true);
    fetch(`/api/football?type=standings&league=${leagueId}`)
      .then((r) => r.json())
      .then((data) => setStandings(data.standings))
      .catch(() => setStandings(null))
      .finally(() => setStandingsLoading(false));
  }, [standingsLeague]);

  async function toggleExpand(match) {
    if (expandedId === match.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(match.id);

    if (analysisCache[match.id]) return; // already fetched

    const isReal = !!match.homeId; // mock matches don't have real ids
    if (!isReal) return;

    const [oddsRes, squadHomeRes, squadAwayRes] = await Promise.all([
      fetch(`/api/football?type=odds&fixture=${match.id}`).then((r) => r.json()).catch(() => ({ odds: null })),
      fetch(`/api/football?type=squad&team=${match.homeId}`).then((r) => r.json()).catch(() => ({ squad: null })),
      fetch(`/api/football?type=squad&team=${match.awayId}`).then((r) => r.json()).catch(() => ({ squad: null })),
    ]);

    let prediction = null;
    if (isVipUnlockedToday()) {
      const predRes = await fetch(`/api/football?type=predictions&fixture=${match.id}`).then((r) => r.json()).catch(() => ({ prediction: null }));
      prediction = predRes.prediction;
    }

    setAnalysisCache((prev) => ({
      ...prev,
      [match.id]: { odds: oddsRes.odds, squadHome: squadHomeRes.squad, squadAway: squadAwayRes.squad, prediction },
    }));
  }

  async function loadPredictionAfterUnlock(matchId) {
    const predRes = await fetch(`/api/football?type=predictions&fixture=${matchId}`).then((r) => r.json()).catch(() => ({ prediction: null }));
    setAnalysisCache((prev) => ({
      ...prev,
      [matchId]: { ...(prev[matchId] || {}), prediction: predRes.prediction },
    }));
  }

  return (
    <div className="container" style={{ padding: "48px 24px 64px" }}>
      <div className="eyebrow">{t.nav.matches}</div>
      <h1 style={{ fontSize: 32, marginTop: 8, marginBottom: 28 }}>{t.nav.matches}</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {matches.map((m) => {
          const analysis = analysisCache[m.id];
          const isExpanded = expandedId === m.id;
          const displayOdds = analysis?.odds || (m.oddHome ? { home: m.oddHome, draw: m.oddDraw, away: m.oddAway } : null);

          return (
            <div key={m.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11.5, color: "var(--gold)", fontWeight: 700, textTransform: "uppercase" }}>{m.league}</div>
                  <div style={{ fontWeight: 700, fontSize: 15.5, marginTop: 2 }}>{m.home} vs {m.away}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{m.time}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {displayOdds && (
                    <div style={{ display: "flex", gap: 8 }}>
                      {[["1", displayOdds.home], ["X", displayOdds.draw], ["2", displayOdds.away]].map(([label, odd]) => (
                        <div key={label} style={{ textAlign: "center", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 12px" }}>
                          <div style={{ fontSize: 10, color: "var(--muted)" }}>{label}</div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{odd}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => toggleExpand(m)} className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 12.5 }}>
                    {isExpanded ? (lang === "fr" ? "Fermer" : "Close") : (lang === "fr" ? "Voir l'analyse" : "See analysis")}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  {!m.homeId && (
                    <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
                      {lang === "fr" ? "Analyse détaillée disponible uniquement sur les matchs en direct." : "Detailed analysis only available for live matches."}
                    </p>
                  )}

                  {m.homeId && analysis && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--forest)", marginBottom: 6 }}>{m.home}</p>
                          {(analysis.squadHome || []).slice(0, 5).map((p) => (
                            <p key={p.name} style={{ fontSize: 12.5, margin: "3px 0", color: "var(--muted)" }}>
                              {p.name} <span style={{ opacity: 0.7 }}>· {p.position}</span>
                            </p>
                          ))}
                          {!analysis.squadHome?.length && (
                            <p style={{ fontSize: 12, color: "var(--muted)" }}>{lang === "fr" ? "Composition indisponible." : "Squad unavailable."}</p>
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--forest)", marginBottom: 6 }}>{m.away}</p>
                          {(analysis.squadAway || []).slice(0, 5).map((p) => (
                            <p key={p.name} style={{ fontSize: 12.5, margin: "3px 0", color: "var(--muted)" }}>
                              {p.name} <span style={{ opacity: 0.7 }}>· {p.position}</span>
                            </p>
                          ))}
                          {!analysis.squadAway?.length && (
                            <p style={{ fontSize: 12, color: "var(--muted)" }}>{lang === "fr" ? "Composition indisponible." : "Squad unavailable."}</p>
                          )}
                        </div>
                      </div>

                      <div style={{ background: "var(--paper)", borderRadius: 10, padding: 14 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                          🔮 {lang === "fr" ? "Prédiction officielle" : "Official prediction"}
                        </p>

                        {unlocked && analysis.prediction && (
                          <div style={{ fontSize: 13 }}>
                            {analysis.prediction.advice && <p style={{ margin: "4px 0", fontWeight: 600 }}>{analysis.prediction.advice}</p>}
                            <div style={{ display: "flex", gap: 14, marginTop: 6, color: "var(--muted)" }}>
                              <span>1: {analysis.prediction.winPercentHome}</span>
                              <span>X: {analysis.prediction.winPercentDraw}</span>
                              <span>2: {analysis.prediction.winPercentAway}</span>
                            </div>
                          </div>
                        )}

                        {unlocked && !analysis.prediction && (
                          <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
                            {lang === "fr" ? "Prédiction indisponible pour ce match." : "Prediction unavailable for this match."}
                          </p>
                        )}

                        {!unlocked && (
                          <div>
                            <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>
                              {lang === "fr"
                                ? "🔒 Inclus avec votre Ticket VIP — débloquez pour voir les probabilités et le conseil de nos algorithmes."
                                : "🔒 Included with your VIP Ticket — unlock to see probabilities and our algorithm's advice."}
                            </p>
                            <button
                              onClick={() => setShowPayment(true)}
                              className="btn btn-gold"
                              style={{ padding: "8px 16px", fontSize: 12.5 }}
                            >
                              👑 {lang === "fr" ? "Débloquer (2100 FCFA)" : "Unlock (2100 FCFA)"}
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {availableLeagues.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <div className="eyebrow">{lang === "fr" ? "Classement" : "Standings"}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 16, flexWrap: "wrap" }}>
            {availableLeagues.map((name) => (
              <button
                key={name}
                onClick={() => setStandingsLeague(name)}
                className={standingsLeague === name ? "btn btn-primary" : "btn btn-ghost"}
                style={{ padding: "6px 14px", fontSize: 12.5 }}
              >
                {name}
              </button>
            ))}
          </div>

          {standingsLoading && <div className="spinner" />}

          {!standingsLoading && standings && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--paper)", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>#</th>
                    <th style={{ padding: "10px 12px" }}>{lang === "fr" ? "Équipe" : "Team"}</th>
                    <th style={{ padding: "10px 12px" }}>J</th>
                    <th style={{ padding: "10px 12px" }}>{lang === "fr" ? "V" : "W"}</th>
                    <th style={{ padding: "10px 12px" }}>N</th>
                    <th style={{ padding: "10px 12px" }}>{lang === "fr" ? "D" : "L"}</th>
                    <th style={{ padding: "10px 12px" }}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => (
                    <tr key={row.team} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={{ padding: "8px 12px" }}>{row.rank}</td>
                      <td style={{ padding: "8px 12px", fontWeight: 600 }}>{row.team}</td>
                      <td style={{ padding: "8px 12px" }}>{row.played}</td>
                      <td style={{ padding: "8px 12px" }}>{row.win}</td>
                      <td style={{ padding: "8px 12px" }}>{row.draw}</td>
                      <td style={{ padding: "8px 12px" }}>{row.lose}</td>
                      <td style={{ padding: "8px 12px", fontWeight: 700 }}>{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!standingsLoading && !standings && (
            <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
              {lang === "fr" ? "Classement indisponible pour l'instant." : "Standings unavailable right now."}
            </p>
          )}
        </div>
      )}

      <div style={{ marginTop: 48 }}>
        <div className="eyebrow">{t.footer.promoTitle}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 14, marginTop: 16 }}>
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
      </div>

      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          itemLabel={lang === "fr" ? "Prédictions VIP" : "VIP predictions"}
          onSuccess={() => {
            unlockVipToday();
            setUnlocked(true);
            if (expandedId) loadPredictionAfterUnlock(expandedId);
          }}
        />
      )}
    </div>
  );
}
