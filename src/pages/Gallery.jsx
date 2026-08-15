import { useEffect, useState } from "react";
import { useLang } from "../context/LangContext";
import TicketCard from "../components/TicketCard";
import { ticketGallery } from "../data/mockData";
import { getTicketImages } from "../lib/store";

export default function Gallery() {
  const { t } = useLang();
  const [uploaded, setUploaded] = useState([]);

  useEffect(() => {
    getTicketImages().then(setUploaded);
  }, []);

  const all = [...uploaded, ...ticketGallery];

  return (
    <div className="container" style={{ padding: "48px 24px 64px" }}>
      <div className="eyebrow">{t.gallery.title}</div>
      <h1 style={{ fontSize: 32, marginTop: 8, marginBottom: 6 }}>{t.gallery.title}</h1>
      <p style={{ color: "var(--muted)", marginBottom: 28 }}>{t.gallery.subtitle}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {all.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
}
