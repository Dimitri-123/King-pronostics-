import { useState } from "react";
import { useLang } from "../context/LangContext";
import { TICKET_PRICE, RECEIVING_FEE } from "../data/mockData";
import { recordPayment } from "../lib/store";

const STEPS = { FORM: "form", CONFIRM: "confirm", PROCESSING: "processing", AWAITING: "awaiting", DONE: "done", ERROR: "error" };

export default function PaymentModal({ onClose, itemLabel, onSuccess }) {
  const { t, lang } = useLang();
  const [step, setStep] = useState(STEPS.FORM);
  const [phone, setPhone] = useState("");
  const [channelInfo, setChannelInfo] = useState(null);
  const total = TICKET_PRICE + RECEIVING_FEE;
  const recipientName = import.meta.env.VITE_RECIPIENT_DISPLAY_NAME || "Kelvin — King Pronostics";

  async function handleSubmitPhone(e) {
    e.preventDefault();
    if (phone.trim().length < 9) return;
    setStep(STEPS.CONFIRM);
  }

  async function handleConfirm() {
    setStep(STEPS.PROCESSING);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch("/api/initiate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payerPhone: phone, amount: total }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error("init failed");
      const data = await res.json();

      // Monetbil directly triggers the Mobile Money USSD prompt on the
      // client's phone — no hosted page to show, so we just move to an
      // "awaiting confirmation" screen instead of an iframe/checkout step.
      if (data.reference) {
        setChannelInfo({ name: data.channelName, ussd: data.channelUssd });
        setStep(STEPS.AWAITING);
      } else {
        console.error("initiate-payment: missing reference in response", data);
        setStep(STEPS.ERROR);
        return;
      }

      // Poll verify-payment every 3s, up to ~3 minutes, while the client
      // confirms the payment on their phone.
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts += 1;
        try {
          const vRes = await fetch(`/api/verify-payment?reference=${data.reference}&t=${Date.now()}`, { cache: "no-store" });
          const vData = await vRes.json();
          if (vData.status === "SUCCESSFUL") {
            clearInterval(poll);
            recordPayment({ phone, amount: total, item: itemLabel, date: new Date().toISOString() });
            setStep(STEPS.DONE);
            if (onSuccess) onSuccess();
          } else if (vData.status === "FAILED" || attempts > 60) {
            clearInterval(poll);
            setStep(STEPS.ERROR);
          }
        } catch (pollErr) {
          console.error("verify-payment polling error", pollErr);
          clearInterval(poll);
          setStep(STEPS.ERROR);
        }
      }, 3000);
    } catch (err) {
      console.error("initiate-payment failed", err);
      setStep(STEPS.ERROR);
    }
  }

  return (
    <div style={overlay}>
      <div className="card" style={{ ...modal, maxWidth: 420 }}>
        <button onClick={onClose} style={closeBtn} aria-label="Close">✕</button>

        {step === STEPS.FORM && (
          <form onSubmit={handleSubmitPhone}>
            <h3 style={{ fontSize: 22, marginBottom: 4 }}>{t.payment.title}</h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>{itemLabel}</p>

            <div style={row}><span>{t.payment.amount}</span><strong>{TICKET_PRICE.toLocaleString()} FCFA</strong></div>
            <div style={row}><span>{t.payment.fee}</span><strong>{RECEIVING_FEE} FCFA</strong></div>
            <div style={{ ...row, borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 6 }}>
              <span style={{ fontWeight: 700 }}>{t.payment.total}</span>
              <strong style={{ color: "var(--forest)", fontSize: 18 }}>{total.toLocaleString()} FCFA</strong>
            </div>

            <label style={{ display: "block", marginTop: 18, fontSize: 13, fontWeight: 600 }}>
              {t.payment.phoneLabel}
            </label>
            <input
              required
              type="tel"
              placeholder="6XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={input}
            />

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 18 }}>
              {t.payment.confirm}
            </button>
          </form>
        )}

        {step === STEPS.CONFIRM && (
          <div>
            <h3 style={{ fontSize: 22, marginBottom: 12 }}>{t.payment.confirm}</h3>
            <div className="card" style={{ padding: 16, marginBottom: 16, background: "var(--gold-soft)", border: "1px solid var(--gold)" }}>
              <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                {t.payment.recipientLabel}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{recipientName}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>✓ {t.payment.recipientName}</div>
            </div>
            <div style={row}><span>{t.payment.total}</span><strong>{total.toLocaleString()} FCFA</strong></div>
            <p style={{ fontSize: 13, color: "var(--danger)", marginTop: 12 }}>{t.payment.confirmNote}</p>
            <button onClick={handleConfirm} className="btn btn-gold" style={{ width: "100%", marginTop: 14 }}>
              {t.payment.confirm}
            </button>
          </div>
        )}

        {step === STEPS.PROCESSING && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div className="spinner" />
            <p style={{ marginTop: 16 }}>{t.payment.processing}</p>
          </div>
        )}

        {step === STEPS.AWAITING && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
            <p style={{ fontWeight: 700, fontSize: 16 }}>
              {lang === "fr" ? "Confirmez sur votre téléphone" : "Confirm on your phone"}
            </p>
            <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 8, lineHeight: 1.5 }}>
              {lang === "fr"
                ? `Une demande de paiement ${channelInfo?.name ? `via ${channelInfo.name}` : "Mobile Money"} vient d'être envoyée sur votre téléphone. Composez le code affiché à l'écran (ou validez la notification) pour finaliser.`
                : `A ${channelInfo?.name || "Mobile Money"} payment request has been sent to your phone. Follow the on-screen prompt to confirm.`}
            </p>
            {channelInfo?.ussd && (
              <div style={{ marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, background: "var(--paper)", borderRadius: 8, padding: "8px 12px", display: "inline-block" }}>
                {channelInfo.ussd}
              </div>
            )}
            <div className="spinner" style={{ margin: "20px auto 0" }} />
            <p style={{ fontSize: 11.5, color: "var(--danger)", marginTop: 14 }}>
              {lang === "fr" ? "Ne fermez pas cette fenêtre." : "Don't close this window."}
            </p>
          </div>
        )}

        {step === STEPS.DONE && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div className="stamp" style={{ margin: "0 auto 16px", width: 64, height: 64, fontSize: 10 }}>✓ OK</div>
            <p style={{ fontWeight: 600 }}>{t.payment.success}</p>
            <button onClick={onClose} className="btn btn-primary" style={{ marginTop: 16 }}>OK</button>
          </div>
        )}

        {step === STEPS.ERROR && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p style={{ color: "var(--danger)", fontWeight: 600 }}>{t.payment.failed}</p>
            <button onClick={() => setStep(STEPS.FORM)} className="btn btn-ghost" style={{ marginTop: 16 }}>
              ↺
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(15,42,29,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16,
};
const modal = { width: "100%", maxWidth: 420, padding: 28, position: "relative" };
const closeBtn = {
  position: "absolute", top: 14, right: 14, background: "none", border: "none",
  fontSize: 18, color: "var(--muted)",
};
const row = { display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0" };
const input = {
  width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)",
  marginTop: 6, fontSize: 15,
};
