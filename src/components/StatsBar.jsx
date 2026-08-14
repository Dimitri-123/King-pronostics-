import { useLang } from "../context/LangContext";

export default function StatsBar() {
  const { t } = useLang();
  const stats = [
    { value: "127", label: t.stats.clientsToday },
    { value: "34", label: t.stats.matchesValidated },
    { value: "89%", label: t.stats.successRate },
  ];

  return (
    <div className="container" style={{ display: "flex", flexWrap: "wrap", gap: 32, padding: "28px 24px", justifyContent: "center" }}>
      {stats.map((s) => (
        <div key={s.label} style={{ textAlign: "center", minWidth: 140 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 700, color: "var(--forest)" }}>
            {s.value}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
