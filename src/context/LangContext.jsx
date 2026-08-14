import { createContext, useContext, useState, useMemo } from "react";
import { translations } from "../data/translations";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(
    localStorage.getItem("kp_lang") || "fr"
  );

  const toggleLang = () => {
    const next = lang === "fr" ? "en" : "fr";
    setLang(next);
    localStorage.setItem("kp_lang", next);
  };

  const t = useMemo(() => translations[lang], [lang]);

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
