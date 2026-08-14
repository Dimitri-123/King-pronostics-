import { useState } from "react";
import { useLang } from "../context/LangContext";
import TestimonialsMarquee from "../components/TestimonialsMarquee";
import { addContactMessage } from "../lib/store";

export default function Testimonials() {
  const { lang, t } = useLang();
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    addContactMessage({ text, lang });
    setText("");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div>
      <TestimonialsMarquee limit={80} />
      <TestimonialsMarquee limit={60} />

      <div className="container" style={{ padding: "0 24px 64px", maxWidth: 560 }}>
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 18 }}>
            {lang === "fr" ? "Partagez votre expérience" : "Share your experience"}
          </h3>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            {lang === "fr"
              ? "Votre message est envoyé directement à notre équipe."
              : "Your message goes straight to our team."}
          </p>
          <form onSubmit={submit} style={{ marginTop: 14 }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder={lang === "fr" ? "Votre message…" : "Your message…"}
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--line)", fontFamily: "inherit", fontSize: 14 }}
            />
            <button type="submit" className="btn btn-primary" style={{ marginTop: 10 }}>
              {lang === "fr" ? "Envoyer" : "Send"}
            </button>
            {sent && (
              <p style={{ fontSize: 13, color: "var(--forest)", marginTop: 8 }}>
                {lang === "fr" ? "Merci, message envoyé !" : "Thanks, message sent!"}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
