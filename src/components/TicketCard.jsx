import { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";

const statusMap = {
  won: { key: "statusWon", cls: "status-won" },
  pending: { key: "statusPending", cls: "status-pending" },
  waiting: { key: "statusWaiting", cls: "status-waiting" },
};

// blur rules:
// - forceBlur=true  -> always blurred (VIP page, locked until payment)
// - neverBlur=true  -> never blurred (Free tickets page, always fully visible)
// - otherwise       -> blurred only when status is "waiting"
//
// click behavior:
// - onCardClick provided -> whole card is clickable, calls that (used for VIP unlock)
// - zoomable=true        -> clicking a clear (non-blurred) image opens a fullscreen lightbox
// - linkToGallery=true   -> whole card links to /galerie (used on Home page previews)
export default function TicketCard({ ticket, linkToGallery = false, neverBlur = false, forceBlur = false, zoomable = false, onCardClick = null }) {
  const { t } = useLang();
  const [zoomed, setZoomed] = useState(false);
  const s = statusMap[ticket.status] || statusMap.pending;
  // A validated ("won") ticket is always shown clearly — proof of a real
  // result, same as on the public Galerie page — regardless of whether the
  // visitor has paid for today's VIP ticket. Pending/waiting tickets keep
  // the existing forceBlur/neverBlur behavior untouched.
  const shouldBlur = ticket.status === "won" ? false : forceBlur ? true : neverBlur ? false : ticket.status === "waiting";

  function handleImageClick(e) {
    if (onCardClick) return; // card-level click handles it instead
    if (zoomable && !shouldBlur && ticket.imageUrl) {
      e.preventDefault();
      e.stopPropagation();
      setZoomed(true);
    }
  }

  const content = (
    <div className="card" style={{ overflow: "hidden" }}>
      <div
        onClick={handleImageClick}
        style={{
          aspectRatio: "4/3", background: "linear-gradient(135deg, #EFEAD9, #E4DFD2)",
          display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
          overflow: "hidden", cursor: (zoomable && !shouldBlur && ticket.imageUrl) || onCardClick ? "pointer" : "default",
        }}
      >
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
        {shouldBlur && ticket.previewInfo && (
          <div style={{
            position: "absolute", bottom: 10, left: 10, right: 10,
            background: "rgba(15,42,29,0.85)", color: "#fff",
            padding: "8px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
            textAlign: "center",
          }}>
            {ticket.previewInfo}
          </div>
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

  const wrapped = onCardClick ? (
    <div onClick={onCardClick} style={{ cursor: "pointer" }}>{content}</div>
  ) : linkToGallery ? (
    <Link to="/galerie" style={{ display: "block" }}>{content}</Link>
  ) : (
    content
  );

  return (
    <>
      {wrapped}
      {zoomed && (
        <div
          onClick={() => setZoomed(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(15,42,29,0.9)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20, cursor: "zoom-out",
          }}
        >
          <img src={ticket.imageUrl} alt={ticket.caption} style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12 }} />
        </div>
      )}
    </>
  );
}
