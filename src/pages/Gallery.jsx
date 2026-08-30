import { useEffect, useState } from "react";
import { useLang } from "../context/LangContext";
import TicketCard from "../components/TicketCard";
import { ticketGallery } from "../data/mockData";
import { getTicketImages } from "../lib/store";

export default function Gallery() {
  const { t } = useLang();
  const [uploaded, setUploaded] = useState([]);

  useEffect(() => {
    getTicketImages().then((serverTickets) => {
      // Only show tickets explicitly published for the Gallery ("gallery"
      // or "both"). Tickets uploaded before this destination field existed
      // have no "destination" set — since the admin form now defaults new
      // uploads to "VIP only", we treat missing destination the same way
      // (not shown here) so this actually fixes already-published tickets
      // too, not just new ones.
      const forGallery = serverTickets.filter(
        (t) => t.destination === "gallery" || t.destination === "both"
      );
      setUploaded(forGallery);
    });
  }, []);

  const all = [...uploaded, ...ticketGallery];

  return (
    <div className="container" style={{ padding: "48px 24px 64px" }}>
      <div className="eyebrow">{t.gallery.title}</div>
      <h1 style={{ fontSize: 32, marginTop: 8, marginBottom: 6 }}>{t.gallery.title}</h1>
      <p style={{ color: "var(--muted)", marginBottom: 28 }}>{t.gallery.subtitle}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {all.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} zoomable />
        ))}
      </div>
    </div>
  );
}
