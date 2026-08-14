import { useEffect, useState } from "react";
import { useLang } from "../context/LangContext";
import PrognosticCard from "../components/PrognosticCard";
import PaymentModal from "../components/PaymentModal";
import { prognosticsToday } from "../data/mockData";
import { getPrognostics } from "../lib/store";

export default function Prognostics() {
  const { t } = useLang();
  const [selected, setSelected] = useState(null);
  const [adminList, setAdminList] = useState([]);

  useEffect(() => {
    setAdminList(getPrognostics());
  }, []);

  const all = [...adminList, ...prognosticsToday];

  return (
    <div className="container" style={{ padding: "48px 24px 64px" }}>
      <div className="eyebrow">{t.prognostics.title}</div>
      <h1 style={{ fontSize: 32, marginTop: 8, marginBottom: 6 }}>{t.prognostics.title}</h1>
      <p style={{ color: "var(--muted)", marginBottom: 12 }}>{t.prognostics.subtitle}</p>

      <div style={{ background: "var(--gold-soft)", color: "var(--forest-deep)", padding: "10px 16px", borderRadius: 10, display: "inline-block", fontSize: 13.5, fontWeight: 600, marginBottom: 28 }}>
        {t.prognostics.bonus}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {all.map((p) => (
          <PrognosticCard key={p.id} prognostic={p} onUnlock={setSelected} />
        ))}
      </div>

      {selected && (
        <PaymentModal
          onClose={() => setSelected(null)}
          itemLabel={`${selected.teamA} vs ${selected.teamB}`}
        />
      )}
    </div>
  );
}
