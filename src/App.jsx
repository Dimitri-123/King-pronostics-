import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LangProvider } from "./context/LangContext";
import Navbar from "./components/Navbar";
import InstallPrompt from "./components/InstallPrompt";
import Home from "./pages/Home";
import Matches from "./pages/Matches";
import Gallery from "./pages/Gallery";
import Prognostics from "./pages/Prognostics";
import Testimonials from "./pages/Testimonials";
import Dashboard from "./pages/Dashboard";
import { useLang } from "./context/LangContext";

function Footer() {
  const { t } = useLang();
  return (
    <footer style={{ borderTop: "1px solid var(--line)", padding: "28px 0", marginTop: 40 }}>
      <div className="container" style={{ fontSize: 12.5, color: "var(--muted)", textAlign: "center" }}>
        {t.footer.disclaimer} · King Pronostics © {new Date().getFullYear()}
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/matchs" element={<Matches />} />
          <Route path="/galerie" element={<Gallery />} />
          <Route path="/pronostics" element={<Prognostics />} />
          <Route path="/temoignages" element={<Testimonials />} />
          <Route path="/espace-prive" element={<Dashboard />} />
        </Routes>
        <Footer />
        <InstallPrompt />
      </BrowserRouter>
    </LangProvider>
  );
}
