import { useState } from "react";
import { useLang } from "../context/LangContext";

export default function PrognosticCard({ prognostic, onUnlock }) {
  const { t, lang } = useLang();
  const [revealed, setRevealed] = useState(false);

  const isFree = !!prognostic.isFree;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="eyebrow">{prognostic.championship}</div>
          <h3 style={{ fontSize: 19, marginTop: 6 }}>
            {prognostic.teamA} <span style={{ color: "var(--muted)", fontWeight: 400 }}>vs</span> {prognostic.teamB}
          </h3>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {isFree && (
            <span style={{ background: "var(--forest)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999 }}>
              🎁 {lang === "fr" ? "GRATUIT" : "FREE"}
            </span>
          )}
          {prognostic.isNew && (
            <span style={{ background: "var(--gold-soft)", color: "var(--gold)", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999 }}>
              NEW
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 18, margin: "14px 0", fontSize: 13, color: "var(--muted)" }}>
        <span>{prognostic.successRate}% {t.stats.successRate.split("(")[0]}</span>
        <span>{prognostic.buyers} {t.prognostics.buyersCount}</span>
      </div>

      {isFree && revealed ? (
        <div style={{ padding: "14px 12px", borderRadius: 10, background: "var(--gold-soft)", fontWeight: 700, fontSize: 14, textAlign: "center" }}>
          {prognostic.prediction}
        </div>
      ) : (
        <button
          onClick={() => (isFree ? setRevealed(true) : onUnlock(prognostic))}
          style={{
            width: "100%",
            padding: "16px 12px",
            borderRadius: 10,
            border: "1px dashed var(--gold)",
            background: "var(--gold-soft)",
            color: "var(--forest-deep)",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {isFree ? "🎁" : "🔒"} {isFree ? (lang === "fr" ? "Voir gratuitement" : "See for free") : t.prognostics.locked}
        </button>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
        <span>{t.prognostics.expiresAt} {prognostic.expiresAt}</span>
      </div>
    </div>
  );
}
