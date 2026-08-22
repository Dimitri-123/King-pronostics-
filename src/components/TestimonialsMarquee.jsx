import { useMemo } from "react";
import { useLang } from "../context/LangContext";
import { generateTestimonials } from "../data/testimonials";

// Vertical scrolling chat feed — looks like a live stream of client
// messages coming in, one bubble under the other, like a real chat app.
export default function TestimonialsMarquee({ limit = 30 }) {
  const { lang, t } = useLang();
  const items = useMemo(() => generateTestimonials(lang, limit), [lang, limit]);
  const looped = [...items, ...items];

  return (
    <section style={{ padding: "48px 0" }}>
      <div className="container">
        <div className="eyebrow">{t.testimonials.title}</div>
        <p style={{ color: "var(--muted)", marginTop: 4, marginBottom: 20 }}>{t.testimonials.subtitle}</p>
      </div>

      <div className="container" style={{ maxWidth: 560 }}>
        <div style={{ height: 480, overflow: "hidden", position: "relative", borderRadius: 16, border: "1px solid var(--line)", background: "var(--panel)" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, var(--panel), transparent 8%, transparent 92%, var(--panel))", zIndex: 2, pointerEvents: "none" }} />
          <div className="chat-scroll">
            {looped.map((msg, i) => (
              <div key={`${msg.id}-${i}`} style={{ display: "flex", gap: 10, padding: "10px 16px", alignItems: "flex-start" }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  background: "var(--forest)", color: "#fff", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
                }}>
                  {msg.name.charAt(0)}
                </div>
                <div style={{
                  background: "var(--paper)", border: "1px solid var(--line)",
                  borderRadius: "4px 14px 14px 14px", padding: "8px 12px", maxWidth: "82%",
                }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{msg.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13.5, lineHeight: 1.4 }}>{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
