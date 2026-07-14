"use client";

// elsewhr — destination chip: where this person is headed
// New file: app/p/[id]/DestChip.tsx

import { useLang } from "@/lib/i18n";

const STATUS_LABELS: Record<string, Record<string, string>> = {
  en: { applied: "applied", accepted: "accepted", arriving: "arriving", current: "already there", graduated: "graduated" },
  es: { applied: "aplicó", accepted: "aceptado", arriving: "llegando", current: "ya está ahí", graduated: "graduado" },
  pt: { applied: "aplicou", accepted: "aceito", arriving: "chegando", current: "já está lá", graduated: "formado" },
  hi: { applied: "आवेदन किया", accepted: "स्वीकृत", arriving: "पहुँच रहे हैं", current: "पहले से वहाँ", graduated: "स्नातक" },
  pl: { applied: "aplikował", accepted: "przyjęty", arriving: "przybywa", current: "już tam jest", graduated: "absolwent" },
  fr: { applied: "candidature envoyée", accepted: "accepté", arriving: "arrive", current: "déjà sur place", graduated: "diplômé" },
};

export default function DestChip({
  place,
  program,
  term,
  status,
}: {
  place: string | null;
  program: string | null;
  term: string | null;
  status: string | null;
}) {
  const { lang } = useLang();
  if (!place || !place.trim()) return null;

  const labels = STATUS_LABELS[lang] || STATUS_LABELS.en;
  const statusLabel = status && labels[status] ? labels[status] : null;

  const parts = [place.trim()];
  if (program && program.trim()) parts.push(program.trim());
  if (term && term.trim()) parts.push(term.trim());

  return (
    <p className="mt-3 font-mono text-[12.5px] text-[#c8f000]">
      → {parts.join(" · ")}
      {statusLabel && (
        <span className="ml-2 px-2 py-0.5 rounded-full border border-[#c8f000]/60 text-[10.5px] uppercase tracking-wider">
          {statusLabel}
        </span>
      )}
    </p>
  );
}
