"use client";

// elsewhr — ask the bird: "who's at this university?" "any part-time job posts?"
// New file: app/w/AskBird.tsx
// The page hands the bird everything it knows; the bird answers from that, or admits it can't.

import { useState } from "react";
import { useLang } from "@/lib/i18n";

const STRINGS: Record<string, { title: string; ph: string; ask: string; thinking: string }> = {
  en: { title: "ask the bird about this place", ph: "who's arriving? any part-time posts? is it pricey?", ask: "ask", thinking: "…" },
  es: { title: "pregúntale al pájaro sobre este lugar", ph: "¿quién llega? ¿hay trabajos? ¿es caro?", ask: "preguntar", thinking: "…" },
  pt: { title: "pergunte ao pássaro sobre este lugar", ph: "quem chega? tem vagas? é caro?", ask: "perguntar", thinking: "…" },
  hi: { title: "इस जगह के बारे में चिड़िया से पूछो", ph: "कौन आ रहा है? कोई पार्ट-टाइम पोस्ट? महँगा है?", ask: "पूछो", thinking: "…" },
  pl: { title: "zapytaj ptaka o to miejsce", ph: "kto przyjeżdża? są ogłoszenia o pracy? drogo tu?", ask: "zapytaj", thinking: "…" },
  fr: { title: "demande à l'oiseau", ph: "qui arrive ? des jobs ? c'est cher ?", ask: "demander", thinking: "…" },
};

export default function AskBird({ context }: { context: string }) {
  const { lang } = useLang();
  const s = STRINGS[lang] || STRINGS.en;
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function ask() {
    const question = q.trim();
    if (question.length < 2 || busy) return;
    setBusy(true);
    setAnswer(null);
    try {
      const r = await fetch("/api/bird", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, context }),
      });
      const d = await r.json();
      setAnswer(d.ok ? (d.answer as string) : (d.error as string) || "the bird is resting — try again");
    } catch {
      setAnswer("the bird is resting — try again");
    }
    setBusy(false);
  }

  return (
    <div className="mt-6 bg-[#1c1410] text-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl p-5 shadow-[7px_7px_0_rgba(28,20,16,0.35)]">
      <p className="font-mono text-[10.5px] uppercase tracking-widest text-[#c8f000] mb-2.5">🐦 {s.title}</p>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
          placeholder={s.ph}
          maxLength={300}
          className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border-2 border-[#fff6ec]/30 bg-[#fff6ec]/10 text-[#fff6ec] placeholder-[#fff6ec]/40 outline-none focus:border-[#c8f000] text-[14px]"
        />
        <button
          type="button"
          onClick={ask}
          disabled={busy || q.trim().length < 2}
          className="px-4 py-2.5 rounded-xl border-2 border-[#c8f000] bg-[#c8f000] text-[#1c1410] font-bold text-[13px] disabled:opacity-40"
        >
          {busy ? s.thinking : s.ask}
        </button>
      </div>
      {answer && (
        <p className="mt-3 text-[14px] leading-snug bg-[#fff6ec]/10 border border-[#fff6ec]/20 rounded-xl px-3.5 py-3 whitespace-pre-line">
          {answer}
        </p>
      )}
    </div>
  );
}
