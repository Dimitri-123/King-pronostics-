import { useMemo } from "react";
import { useLang } from "../context/LangContext";
import { generateTestimonials } from "../data/testimonials";

export default function TestimonialsMarquee({ limit = 40 }) {
  const { lang, t } = useLang();
  // Full pool is 500; we render a rotating slice for perf and loop the track visually.
  const items = useMemo(() => generateTestimonials(lang, limit), [lang, limit]);
  const looped = [...items, ...items];

  return (
    <section style={{ padding: "48px 0", overflow: "hidden" }}>
      <div className="container">
        <div className="eyebrow">{t.testimonials.title}</div>
        <p style={{ color: "var(--muted)", marginTop: 4, marginBottom: 20 }}>{t.testimonials.subtitle}</p>
      </div>
      <div style={{ overflow: "hidden" }}>
        <div className="marquee-track">
          {looped.map((msg, i) => (
            <div
              key={`${msg.id}-${i}`}
              className="card"
              style={{ minWidth: 280, maxWidth: 280, padding: 16, flexShrink: 0 }}
            >
              <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>{msg.text}</p>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, marginBottom: 0 }}>
                — {msg.name}, {msg.city}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
