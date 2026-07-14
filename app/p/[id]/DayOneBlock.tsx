"use client";

// elsewhr — the DAY ONE block: starting from zero, displayed with pride
// New file: app/p/[id]/DayOneBlock.tsx
// Self-contained: strings for all six languages live in this file.

import { useLang } from "@/lib/i18n";

const STRINGS: Record<string, { badge: string; line: string; first: string }> = {
  en: { badge: "day one", line: "everyone starts at zero.", first: "first step:" },
  es: { badge: "día uno", line: "todos empiezan en cero.", first: "primer paso:" },
  pt: { badge: "dia um", line: "todo mundo começa do zero.", first: "primeiro passo:" },
  hi: { badge: "दिन एक", line: "हर कोई शून्य से शुरू करता है।", first: "पहला कदम:" },
  pl: { badge: "dzień 1", line: "każdy zaczyna od zera.", first: "pierwszy krok:" },
  fr: { badge: "jour un", line: "tout le monde commence à zéro.", first: "premier pas :" },
};

export default function DayOneBlock({ firstStep }: { firstStep: string }) {
  const { lang } = useLang();
  const s = STRINGS[lang] || STRINGS.en;

  if (!firstStep || !firstStep.trim()) return null;

  return (
    <section className="rise mt-6" style={{ animationDelay: "180ms" }}>
      <div className="bg-[#6b4eff] text-[#fff6ec] rounded-3xl border-[3px] border-[#1c1410] shadow-[8px_8px_0_rgba(28,20,16,0.9)] p-6 overflow-hidden relative">
        <span className="inline-block px-3 py-1 rounded-full bg-[#c8f000] text-[#1c1410] font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-[#1c1410]">
          {s.badge} ◦
        </span>
        <p className="font-[Syne] font-extrabold text-2xl leading-tight mt-3">{s.line}</p>
        <p className="mt-3 text-[15px] leading-relaxed">
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#c8f000]">{s.first}</span>{" "}
          {firstStep.trim()}
        </p>
      </div>
    </section>
  );
}
