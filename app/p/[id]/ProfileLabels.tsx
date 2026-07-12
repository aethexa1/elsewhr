"use client";

// elsewhr — profile labels: elsewhr's own voice, in the reader's language
// Create this file at: app/p/[id]/ProfileLabels.tsx

import Link from "next/link";
import { useLang, t } from "@/lib/i18n";

export function BackLink() {
  const { lang } = useLang();
  return (
    <Link
      href="/"
      className="px-4 py-2 rounded-xl border-2 border-[#1c1410] bg-[#fff6ec] font-bold text-sm hover:translate-y-[-2px] transition-transform"
    >
      {t(lang, "nav.everyone")}
    </Link>
  );
}

export function SampleBadge() {
  const { lang } = useLang();
  return (
    <span className="inline-block mb-3 px-2.5 py-1 rounded-full border-2 border-[#fff6ec]/40 bg-[#fff6ec]/10 font-mono text-[10px] uppercase tracking-widest text-[#fff6ec]/80">
      {t(lang, "sample.long")}
    </span>
  );
}

export function LookingForLabel() {
  const { lang } = useLang();
  return (
    <span className="font-mono text-[10px] uppercase tracking-widest text-[#00c2d1]">
      {t(lang, "profile.lookingFor")}{" "}
    </span>
  );
}

export function LocationLine({ location }: { location: string }) {
  const { lang } = useLang();
  return (
    <p className="font-mono text-xs text-[#9a8e82] mt-3 tracking-wide">
      {location || t(lang, "profile.somewhere")} · {t(lang, "profile.showsReal")}
    </p>
  );
}

export function WorkHeading() {
  const { lang } = useLang();
  return (
    <h2 className="font-[Syne] font-bold text-lg mt-6 mb-3 text-[#fff6ec]">
      {t(lang, "profile.theWork")}
    </h2>
  );
}

export function LearningLabel() {
  const { lang } = useLang();
  return (
    <span className="font-mono text-[10px] uppercase tracking-widest text-[#b9542f]">
      {t(lang, "profile.learning")}{" "}
    </span>
  );
}

export function GoalLabel() {
  const { lang } = useLang();
  return (
    <span className="font-mono text-[10px] uppercase tracking-widest text-[#6b4eff]">
      {t(lang, "profile.goal")}{" "}
    </span>
  );
}

export function LivingFooter() {
  const { lang } = useLang();
  return (
    <p className="font-mono text-[11px] text-[#fff6ec]/80 mt-8 text-center">
      {t(lang, "profile.living")}{" "}
      <Link href="/login" className="underline">
        {t(lang, "profile.makeYours")}
      </Link>
    </p>
  );
}

export function NotFound() {
  const { lang } = useLang();
  return (
    <div className="bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl p-8 max-w-md text-center">
      <p className="font-bold text-lg mb-2">{t(lang, "profile.notFound")}</p>
      <Link href="/" className="underline font-bold text-[#6b4eff]">
        {t(lang, "profile.back")}
      </Link>
    </div>
  );
}
