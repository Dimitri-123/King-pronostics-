import { Link, useLocation } from "react-router-dom";
import { useLang } from "../context/LangContext";

export default function Navbar() {
  const { lang, toggleLang, t } = useLang();
  const location = useLocation();

  const links = [
    { to: "/", label: t.nav.home },
    { to: "/matchs", label: t.nav.matches },
    { to: "/galerie", label: t.nav.gallery },
    { to: "/pronostics", label: t.nav.prognostics },
    { to: "/temoignages", label: t.nav.blog },
  ];

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(250,248,243,0.9)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--line)" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20 }}>
          <span className="stamp" style={{ width: 34, height: 34, fontSize: 7 }}>KP</span>
          King Pronostics
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 26 }} className="nav-links">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: location.pathname === l.to ? "var(--forest)" : "var(--muted)",
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={toggleLang}
            className="btn btn-ghost"
            style={{ padding: "8px 14px", fontSize: 13 }}
            aria-label="Toggle language"
          >
            {lang === "fr" ? "FR / EN" : "EN / FR"}
          </button>
          <Link to="/espace-prive" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>
            {t.nav.dashboard}
          </Link>
        </div>
      </div>
    </header>
  );
}
