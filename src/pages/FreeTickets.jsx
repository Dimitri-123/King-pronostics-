import { useEffect, useState } from "react";
import { useLang } from "../context/LangContext";
import TicketCard from "../components/TicketCard";
import { getTicketImages, getPrognostics } from "../lib/store";

export default function FreeTickets() {
  const { lang } = useLang();
  const [tickets, setTickets] = useState([]);
  const [prognostics, setPrognostics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTicketImages(), getPrognostics()]).then(([tk, pg]) => {
      setTickets(tk.filter((t) => t.isFree));
      setPrognostics(pg.filter((p) => p.isFree));
      setLoading(false);
    });
  }, []);

  return (
    <div className="container" style={{ padding: "48px 24px 64px" }}>
      <div className="eyebrow">{lang === "fr" ? "Tickets gratuits" : "Free tickets"}</div>
      <h1 style={{ fontSize: 32, marginTop: 8, marginBottom: 6 }}>
        {lang === "fr" ? "🎁 Tickets gratuits du jour" : "🎁 Today's free tickets"}
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: 28 }}>
        {lang === "fr"
          ? "Aucun paiement requis — profitez-en et partagez avec vos amis."
          : "No payment required — enjoy and share with your friends."}
      </p>

      {loading && <div className="spinner" />}

      {!loading && tickets.length === 0 && prognostics.length === 0 && (
        <p style={{ color: "var(--muted)" }}>
          {lang === "fr" ? "Aucun ticket gratuit disponible pour l'instant." : "No free tickets available right now."}
        </p>
      )}

      {tickets.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      {prognostics.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {prognostics.map((p) => (
            <div key={p.id} className="card" style={{ padding: 20 }}>
              <div className="eyebrow">{p.championship}</div>
              <h3 style={{ fontSize: 18, marginTop: 6 }}>
                {p.teamA} <span style={{ color: "var(--muted)", fontWeight: 400 }}>vs</span> {p.teamB}
              </h3>
              <div style={{ marginTop: 12, padding: 12, background: "var(--gold-soft)", borderRadius: 10, fontWeight: 600 }}>
                {p.prediction}
              </div>
              {p.expiresAt && (
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
                  {lang === "fr" ? "Valable jusqu'à" : "Valid until"} {p.expiresAt}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
