import { useEffect, useState } from "react";
import { useLang } from "../context/LangContext";
import TicketCard from "../components/TicketCard";
import PaymentModal from "../components/PaymentModal";
import { ticketGallery } from "../data/mockData";
import { getTicketImages } from "../lib/store";

function todayKey() {
  return `kp_vip_unlocked_${new Date().toISOString().split("T")[0]}`;
}

export default function VipTickets() {
  const { lang } = useLang();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(!!localStorage.getItem(todayKey()));
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    getTicketImages().then((serverTickets) => {
      const nonFree = serverTickets.filter((t) => !t.isFree);
      setTickets([...nonFree, ...ticketGallery]);
      setLoading(false);
    });
  }, []);

  function handlePaymentClose() {
    setShowPayment(false);
    // If the payment succeeded, PaymentModal's own success screen already
    // showed — we just check again here in case it did.
    if (localStorage.getItem(todayKey())) {
      setUnlocked(true);
    }
  }

  return (
    <div className="container" style={{ padding: "48px 24px 64px" }}>
      <div className="eyebrow">{lang === "fr" ? "Ticket VIP" : "VIP Ticket"}</div>
      <h1 style={{ fontSize: 32, marginTop: 8, marginBottom: 6 }}>
        👑 {lang === "fr" ? "Ticket VIP du jour" : "Today's VIP ticket"}
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: 28, maxWidth: 560 }}>
        {unlocked
          ? (lang === "fr"
              ? "Merci pour votre confiance — voici les tickets VIP du jour, en clair."
              : "Thanks for your trust — here are today's VIP tickets, fully unlocked.")
          : (lang === "fr"
              ? "Payez 2 100 FCFA pour accéder au ticket VIP, analysé et fiable chaque jour. Rejoignez la communauté VIP."
              : "Pay 2,100 FCFA to unlock today's VIP ticket — carefully analyzed and reliable every day. Join the VIP community.")}
      </p>

      {loading && <div className="spinner" />}

      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              forceBlur={!unlocked}
              neverBlur={unlocked}
              zoomable={unlocked}
              onCardClick={unlocked ? null : () => setShowPayment(true)}
            />
          ))}
        </div>
      )}

      {showPayment && (
        <PaymentModal
          onClose={handlePaymentClose}
          itemLabel={lang === "fr" ? "Ticket VIP du jour" : "Today's VIP ticket"}
          onSuccess={() => {
            localStorage.setItem(todayKey(), "1");
            setUnlocked(true);
          }}
        />
      )}
    </div>
  );
}
