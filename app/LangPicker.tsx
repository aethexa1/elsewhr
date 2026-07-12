"use client";

// elsewhr — the language picker: the door, in your own words
// Create this file at: app/LangPicker.tsx

import { useState } from "react";
import { useLang, LANGS } from "@/lib/i18n";

export default function LangPicker() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Change language"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-[#1c1410] bg-[#fff6ec] font-bold text-sm hover:translate-y-[-2px] transition-transform"
      >
        <span className="text-[15px] leading-none">{current.flag}</span>
        <span className="font-mono text-[11px] uppercase">{current.code}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-2xl shadow-[6px_6px_0_rgba(28,20,16,0.85)] overflow-hidden z-30">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex items-center gap-2.5 w-full text-left px-4 py-3 text-sm font-bold hover:bg-[#c8f000]/40 border-b border-[#1c1410]/10 last:border-b-0 ${
                l.code === lang ? "bg-[#c8f000]/25" : ""
              }`}
            >
              <span className="text-[16px] leading-none">{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
