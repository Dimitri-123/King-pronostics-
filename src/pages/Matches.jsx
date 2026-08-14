import { useEffect, useState } from "react";
import { useLang } from "../context/LangContext";
import { matchesToday, promoCodes } from "../data/mockData";
import { fetchTodayFixtures } from "../lib/footballApi";

export default function Matches() {
  const { t } = useLang();
  const [matches, setMatches] = useState(matchesToday);

  useEffect(() => {
    fetchTodayFixtures().then((live) => {
      if (live && live.length) setMatches(live);
    });
  }, []);

  return (
    <div className="container" style={{ padding: "48px 24px 64px" }}>
      <div className="eyebrow">{t.nav.matches}</div>
      <h1 style={{ fontSize: 32, marginTop: 8, marginBottom: 28 }}>{t.nav.matches}</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {matches.map((m) => (
          <div key={m.id} className="card" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11.5, color: "var(--gold)", fontWeight: 700, textTransform: "uppercase" }}>{m.league}</div>
              <div style={{ fontWeight: 700, fontSize: 15.5, marginTop: 2 }}>{m.home} vs {m.away}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{m.time}</div>
            </div>
            {m.oddHome && (
              <div style={{ display: "flex", gap: 8 }}>
                {[["1", m.oddHome], ["X", m.oddDraw], ["2", m.oddAway]].map(([label, odd]) => (
                  <div key={label} style={{ textAlign: "center", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 12px" }}>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>{label}</div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{odd}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

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
    </div>
  );
}
