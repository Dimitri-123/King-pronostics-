import { useLang } from "../context/LangContext";

export default function PrognosticCard({ prognostic, onUnlock }) {
  const { t } = useLang();

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="eyebrow">{prognostic.championship}</div>
          <h3 style={{ fontSize: 19, marginTop: 6 }}>
            {prognostic.teamA} <span style={{ color: "var(--muted)", fontWeight: 400 }}>vs</span> {prognostic.teamB}
          </h3>
        </div>
        {prognostic.isNew && (
          <span style={{ background: "var(--gold-soft)", color: "var(--gold)", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999 }}>
            NEW
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 18, margin: "14px 0", fontSize: 13, color: "var(--muted)" }}>
        <span>{prognostic.successRate}% {t.stats.successRate.split("(")[0]}</span>
        <span>{prognostic.buyers} {t.prognostics.buyersCount}</span>
      </div>

      <button
        onClick={() => onUnlock(prognostic)}
        style={{
          width: "100%",
          padding: "16px 12px",
          borderRadius: 10,
          border: "1px dashed var(--gold)",
          background: "var(--gold-soft)",
          color: "var(--forest-deep)",
          fontWeight: 700,
          fontSize: 14,
          filter: "none",
        }}
      >
        🔒 {t.prognostics.locked}
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
        <span>{t.prognostics.expiresAt} {prognostic.expiresAt}</span>
      </div>
    </div>
  );
}
