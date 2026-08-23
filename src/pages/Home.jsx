import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";
import StatsBar from "../components/StatsBar";
import TicketCard from "../components/TicketCard";
import TestimonialsMarquee from "../components/TestimonialsMarquee";
import { ticketGallery } from "../data/mockData";

export default function Home() {
  const { lang } = useLang();

  return (
    <div>
      <section style={{ padding: "72px 0 40px", background: "linear-gradient(180deg, #F3EFE3, var(--paper))" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="eyebrow">{lang === "fr" ? "King Pronostics" : "King Pronostics"}</div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", marginTop: 10, lineHeight: 1.08 }}>
            {lang === "fr" ? "Des pronostics vérifiés, un ticket à la fois." : "Verified predictions, one ticket at a time."}
          </h1>
          <p style={{ fontSize: 17, color: "var(--muted)", marginTop: 16, maxWidth: 540 }}>
            {lang === "fr"
              ? "Chaque ticket publié est daté, suivi et validé publiquement. Pas de promesses en l'air — juste des preuves."
              : "Every ticket we publish is timestamped, tracked, and validated publicly. No empty promises — just proof."}
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
            <Link to="/vip" className="btn btn-gold">
              👑 {lang === "fr" ? "Voir le ticket VIP du jour" : "See today's VIP ticket"}
            </Link>
            <Link to="/pronostics" className="btn btn-ghost">
              {lang === "fr" ? "Comment ça marche" : "How it works"}
            </Link>
            <Link to="/gratuit" className="btn btn-ghost" style={{ borderColor: "var(--forest)", color: "var(--forest)" }}>
              🎁 {lang === "fr" ? "Ticket gratuit" : "Free ticket"}
            </Link>
          </div>
        </div>
      </section>

      <StatsBar />

      <section className="container" style={{ padding: "20px 24px 56px" }}>
        <div className="eyebrow">{lang === "fr" ? "Galerie des tickets" : "Ticket gallery"}</div>
        <p style={{ color: "var(--muted)", marginTop: 4, marginBottom: 22 }}>
          {lang === "fr" ? "En cours de validation, validés, en attente — en toute transparence." : "Being validated, won, or awaiting kickoff — fully transparent."}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {ticketGallery.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} linkToGallery />
          ))}
        </div>
      </section>

      <TestimonialsMarquee />
    </div>
  );
}
