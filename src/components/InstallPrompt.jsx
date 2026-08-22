import { useEffect, useState } from "react";
import { useLang } from "../context/LangContext";
import { requestPushSubscription } from "../lib/push";

export default function InstallPrompt() {
  const { t } = useLang();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handler(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem("kp_install_dismissed")) {
        setVisible(true);
      }
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible) return null;

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setVisible(false);
    // Ask for notification permission right after install — a natural
    // moment since the person just showed real intent to use the app.
    requestPushSubscription();
  }

  function dismiss() {
    localStorage.setItem("kp_install_dismissed", "1");
    setVisible(false);
  }

  return (
    <div style={{
      position: "fixed", bottom: 16, left: 16, right: 16, zIndex: 90,
      maxWidth: 420, margin: "0 auto",
    }}>
      <div className="card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <span className="stamp" style={{ width: 40, height: 40, fontSize: 8 }}>KP</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{t.install.title}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--muted)" }}>{t.install.body}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={install} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12 }}>
            {t.install.cta}
          </button>
          <button onClick={dismiss} style={{ background: "none", border: "none", fontSize: 11, color: "var(--muted)" }}>
            {t.install.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
