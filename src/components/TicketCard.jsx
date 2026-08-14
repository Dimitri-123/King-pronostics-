import { useLang } from "../context/LangContext";

const statusMap = {
  won: { key: "statusWon", cls: "status-won" },
  pending: { key: "statusPending", cls: "status-pending" },
  waiting: { key: "statusWaiting", cls: "status-waiting" },
};

export default function TicketCard({ ticket }) {
  const { t } = useLang();
  const s = statusMap[ticket.status] || statusMap.pending;

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ aspectRatio: "4/3", background: "linear-gradient(135deg, #EFEAD9, #E4DFD2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {ticket.imageUrl ? (
          <img src={ticket.imageUrl} alt={ticket.caption} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span className="stamp">TICKET</span>
        )}
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600 }}>
          <span className={`status-dot ${s.cls}`} />
          {t.gallery[s.key]}
        </div>
        <p style={{ margin: "6px 0 2px", fontSize: 14, fontWeight: 600 }}>{ticket.caption}</p>
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{ticket.timestamp}</p>
      </div>
    </div>
  );
}
