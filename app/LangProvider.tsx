"use client";

// elsewhr — language provider: detects your language, remembers your choice
// Create this file at: app/LangProvider.tsx

import { useEffect, useState } from "react";
import { LangContext, type Lang } from "@/lib/i18n";

const SUPPORTED: Lang[] = ["en", "es", "pt", "hi", "pl", "fr"];

export default function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 1) what they chose before wins
    const saved = window.localStorage.getItem("elsewhr_lang") as Lang | null;
    if (saved && SUPPORTED.includes(saved)) {
      setLangState(saved);
      setReady(true);
      return;
    }
    // 2) otherwise, meet them in their browser's language
    const browser = (navigator.language || "en").slice(0, 2).toLowerCase() as Lang;
    if (SUPPORTED.includes(browser)) setLangState(browser);
    setReady(true);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      window.localStorage.setItem("elsewhr_lang", l);
    } catch {
      // private mode — the choice just won't persist
    }
  }

  if (!ready) return null;

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}
