import { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";
import StatsBar from "../components/StatsBar";
import TicketCard from "../components/TicketCard";
import TestimonialsMarquee from "../components/TestimonialsMarquee";
import PaymentModal from "../components/PaymentModal";
import { ticketGallery } from "../data/mockData";

export default function Home() {
  const { t } = useLang();
  const [showPayment, setShowPayment] = useState(false);

  return (
    <div>
      <section style={{ padding: "72px 0 40px", background: "linear-gradient(180deg, #F3EFE3, var(--paper))" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="eyebrow">{t.hero.eyebrow}</div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", marginTop: 10, lineHeight: 1.08 }}>
            {t.hero.title}
          </h1>
          <p style={{ fontSize: 17, color: "var(--muted)", marginTop: 16, maxWidth: 540 }}>
            {t.hero.subtitle}
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
            <button onClick={() => setShowPayment(true)} className="btn btn-gold">
              {t.hero.cta}
            </button>
            <Link to="/pronostics" className="btn btn-ghost">
              {t.hero.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      <StatsBar />

      <section className="container" style={{ padding: "20px 24px 56px" }}>
        <div className="eyebrow">{t.gallery.title}</div>
        <p style={{ color: "var(--muted)", marginTop: 4, marginBottom: 22 }}>{t.gallery.subtitle}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {ticketGallery.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      </section>

      <TestimonialsMarquee />

      {showPayment && (
        <PaymentModal onClose={() => setShowPayment(false)} itemLabel={t.hero.cta} />
      )}
    </div>
  );
}
