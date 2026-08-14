import { useEffect, useState } from "react";
import { useLang } from "../context/LangContext";
import {
  getPayments, addTicketImage, getTicketImages,
  addPrognostic, getPrognostics,
} from "../lib/store";
import { TICKET_PRICE, RECEIVING_FEE } from "../data/mockData";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "change_me_before_launch";
const SHARE_KEY = "kp_share_percent"; // your %, partner gets the rest

export default function Dashboard() {
  const { t, lang } = useLang();
  const [authed, setAuthed] = useState(sessionStorage.getItem("kp_admin_ok") === "1");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const [payments, setPayments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [prognostics, setPrognostics] = useState([]);
  const [sharePercent, setSharePercent] = useState(Number(localStorage.getItem(SHARE_KEY)) || 50);

  const [ticketForm, setTicketForm] = useState({ caption: "", status: "pending" });
  const [prognoForm, setPrognoForm] = useState({ championship: "", teamA: "", teamB: "", prediction: "", expiresAt: "" });

  useEffect(() => {
    if (authed) {
      setPayments(getPayments());
      setTickets(getTicketImages());
      setPrognostics(getPrognostics());
    }
  }, [authed]);

  function handleLogin(e) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("kp_admin_ok", "1");
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  function logout() {
    sessionStorage.removeItem("kp_admin_ok");
    setAuthed(false);
  }

  function submitTicket(e) {
    e.preventDefault();
    addTicketImage(ticketForm);
    setTickets(getTicketImages());
    setTicketForm({ caption: "", status: "pending" });
  }

  function submitPrognostic(e) {
    e.preventDefault();
    addPrognostic(prognoForm);
    setPrognostics(getPrognostics());
    setPrognoForm({ championship: "", teamA: "", teamB: "", prediction: "", expiresAt: "" });
  }

  function updateShare(v) {
    setSharePercent(v);
    localStorage.setItem(SHARE_KEY, String(v));
  }

  if (!authed) {
    return (
      <div className="container" style={{ padding: "80px 24px", maxWidth: 380 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22 }}>{t.dashboard.title}</h2>
          <form onSubmit={handleLogin} style={{ marginTop: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>{t.dashboard.passwordLabel}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--line)", marginTop: 6 }}
            />
            {error && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 6 }}>{t.dashboard.wrongPassword}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 14 }}>
              {t.dashboard.login}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const revenueToday = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const yourShare = Math.round((revenueToday * sharePercent) / 100);
  const partnerShare = revenueToday - yourShare;

  return (
    <div className="container" style={{ padding: "40px 24px 64px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: 28 }}>{t.dashboard.title}</h1>
        <button onClick={logout} className="btn btn-ghost">{t.dashboard.logout}</button>
      </div>

      {/* Revenue split */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 14, marginBottom: 32 }}>
        <StatCard label={t.dashboard.revenueToday} value={`${revenueToday.toLocaleString()} FCFA`} />
        <StatCard label={t.dashboard.clientsToday} value={payments.length} />
        <StatCard label={t.dashboard.yourShare} value={`${yourShare.toLocaleString()} FCFA`} accent />
        <StatCard label={t.dashboard.partnerShare} value={`${partnerShare.toLocaleString()} FCFA`} />
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 32 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>
          {lang === "fr" ? "Votre part (%)" : "Your share (%)"} — {sharePercent}%
        </label>
        <input
          type="range" min="0" max="100" value={sharePercent}
          onChange={(e) => updateShare(Number(e.target.value))}
          style={{ width: "100%", marginTop: 8 }}
        />
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
          {lang === "fr"
            ? "Ce pourcentage est calculé automatiquement à chaque paiement — aucune modification manuelle possible sur les montants déjà enregistrés."
            : "This percentage is applied automatically to every payment — recorded amounts cannot be edited manually."}
        </p>
      </div>

      {/* Upload sections */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }} className="dash-grid">
        <form onSubmit={submitTicket} className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>{t.dashboard.uploadTicket}</h3>
          <input
            required placeholder={lang === "fr" ? "Légende (ex: Combiné 3 matchs)" : "Caption"}
            value={ticketForm.caption}
            onChange={(e) => setTicketForm({ ...ticketForm, caption: e.target.value })}
            style={fieldStyle}
          />
          <select
            value={ticketForm.status}
            onChange={(e) => setTicketForm({ ...ticketForm, status: e.target.value })}
            style={fieldStyle}
          >
            <option value="pending">{t.gallery.statusPending}</option>
            <option value="won">{t.gallery.statusWon}</option>
            <option value="waiting">{t.gallery.statusWaiting}</option>
          </select>
          <input type="file" accept="image/*" style={{ marginTop: 8 }} />
          <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
            {lang === "fr"
              ? "Note: le stockage d'images nécessite un service comme Cloudinary ou Vercel Blob — à connecter avant le lancement."
              : "Note: image storage needs a service like Cloudinary or Vercel Blob — connect before launch."}
          </p>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 10 }}>{t.dashboard.publish}</button>
        </form>

        <form onSubmit={submitPrognostic} className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>{t.dashboard.uploadPrognostic}</h3>
          <input required placeholder={t.dashboard.championship} value={prognoForm.championship}
            onChange={(e) => setPrognoForm({ ...prognoForm, championship: e.target.value })} style={fieldStyle} />
          <input required placeholder={t.dashboard.teamA} value={prognoForm.teamA}
            onChange={(e) => setPrognoForm({ ...prognoForm, teamA: e.target.value })} style={fieldStyle} />
          <input required placeholder={t.dashboard.teamB} value={prognoForm.teamB}
            onChange={(e) => setPrognoForm({ ...prognoForm, teamB: e.target.value })} style={fieldStyle} />
          <input required placeholder={t.dashboard.prognosticText} value={prognoForm.prediction}
            onChange={(e) => setPrognoForm({ ...prognoForm, prediction: e.target.value })} style={fieldStyle} />
          <input placeholder={lang === "fr" ? "Heure limite (ex: 17:00)" : "Expires at"} value={prognoForm.expiresAt}
            onChange={(e) => setPrognoForm({ ...prognoForm, expiresAt: e.target.value })} style={fieldStyle} />
          <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
            {lang === "fr"
              ? "Le pronostic saisi ici reste masqué publiquement jusqu'au paiement du client."
              : "The prediction entered here stays hidden publicly until the client pays."}
          </p>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 10 }}>{t.dashboard.publish}</button>
        </form>
      </div>

      {/* Payments list */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>{t.dashboard.recentPayments}</h3>
        {payments.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            {lang === "fr" ? "Aucun paiement enregistré pour l'instant." : "No payments recorded yet."}
          </p>
        )}
        {payments.map((p) => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>
            <span>{p.phone} — {p.item}</span>
            <strong>{p.amount.toLocaleString()} FCFA</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="card" style={{ padding: 16, borderColor: accent ? "var(--gold)" : undefined }}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: accent ? "var(--gold)" : "var(--forest)" }}>{value}</div>
    </div>
  );
}

const fieldStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line)",
  marginBottom: 8, fontSize: 13.5,
};
