import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";

const statusMap = {
  won: { key: "statusWon", cls: "status-won" },
  pending: { key: "statusPending", cls: "status-pending" },
  waiting: { key: "statusWaiting", cls: "status-waiting" },
};

// When a ticket is still "pending" (en cours de validation), its image is
// blurred so clients can see something is there without seeing the details
// until it's actually validated. Cards without a real image yet still get
// a blurred decorative "fake ticket" look instead of a plain empty box.
export default function TicketCard({ ticket, linkToGallery = false }) {
  const { t } = useLang();
  const s = statusMap[ticket.status] || statusMap.pending;
  const shouldBlur = ticket.status === "pending";

  const content = (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ aspectRatio: "4/3", background: "linear-gradient(135deg, #EFEAD9, #E4DFD2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        {ticket.imageUrl ? (
          <img
            src={ticket.imageUrl}
            alt={ticket.caption}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              filter: shouldBlur ? "blur(14px) saturate(0.8)" : "none",
              transform: shouldBlur ? "scale(1.1)" : "none",
            }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "repeating-linear-gradient(45deg, #E4DFD2, #E4DFD2 10px, #EFEAD9 10px, #EFEAD9 20px)",
            filter: "blur(10px)",
          }} />
        )}
        <span className="stamp" style={{ position: "absolute", background: "rgba(255,255,255,0.85)" }}>
          {shouldBlur ? "🔒" : "TICKET"}
        </span>
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

  if (linkToGallery) {
    return <Link to="/galerie" style={{ display: "block" }}>{content}</Link>;
  }
  return content;
}
