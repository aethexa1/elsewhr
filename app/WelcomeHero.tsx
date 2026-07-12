"use client";

// elsewhr — welcome hero with the crew (logged-out visitors only)
// Replaces app/WelcomeHero.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useLang, t } from "@/lib/i18n";

export default function WelcomeHero() {
  const { lang } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) setShow(true);
    });
  }, []);

  if (!show) return null;

  return (
    <section className="rise mb-12 mt-2" style={{ animationDelay: "40ms" }}>
      <div className="md:flex md:items-center md:gap-8">
        {/* words */}
        <div className="md:flex-1">
          <p className="font-mono text-[12px] tracking-[0.18em] uppercase text-[#c8f000] mb-3">
            {t(lang, "hero.eyebrow")}
          </p>
          <h1 className="font-[Syne] font-extrabold text-[#fff6ec] text-4xl md:text-[52px] leading-[0.98] tracking-tight max-w-[16ch]">
            {t(lang, "hero.title1")}{" "}
            <span className="text-[#c8f000]">{t(lang, "hero.have")}</span>{" "}
            {t(lang, "hero.title2")}{" "}
            <span className="text-[#c8f000]">{t(lang, "hero.needs")}</span>
            {t(lang, "hero.title3")}
          </h1>
          <p className="mt-4 text-[#fff6ec]/90 text-[16px] md:text-[17px] max-w-[46ch] leading-relaxed">
            {t(lang, "hero.body")}
          </p>
          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-2xl border-[3px] border-[#1c1410] bg-[#c8f000] font-bold text-[16px] shadow-[5px_5px_0_#1c1410] hover:translate-y-[-2px] hover:shadow-[7px_8px_0_#1c1410] active:translate-y-0 active:shadow-[3px_3px_0_#1c1410] transition-all"
            >
              {t(lang, "hero.cta")}
            </Link>
            <p className="font-mono text-[11px] text-[#fff6ec]/75 tracking-wide">
              {t(lang, "hero.free")}
            </p>
          </div>
          <p className="mt-4 font-mono text-[12px] text-[#fff6ec]/85">
            {t(lang, "hero.already")}{" "}
            <Link href="/login" className="underline font-bold text-[#c8f000]">
              {t(lang, "hero.login")}
            </Link>
          </p>
        </div>

        {/* the crew — 2D figures */}
        <div className="mt-8 md:mt-0 md:flex-1 flex justify-center md:justify-end">
          <Crew />
        </div>
      </div>
    </section>
  );
}

function Crew() {
  return (
    <svg
      width="380"
      height="230"
      viewBox="0 0 380 230"
      className="w-full max-w-[420px] h-auto"
      role="img"
      aria-label="The elsewhr crew: a welder, a coder, a chef and a student, with the bowerbird"
    >
      {/* ground shadows */}
      <ellipse cx="60" cy="216" rx="42" ry="7" fill="#1c1410" opacity="0.18" />
      <ellipse cx="152" cy="216" rx="42" ry="7" fill="#1c1410" opacity="0.18" />
      <ellipse cx="246" cy="216" rx="42" ry="7" fill="#1c1410" opacity="0.18" />
      <ellipse cx="336" cy="216" rx="38" ry="7" fill="#1c1410" opacity="0.18" />

      {/* ——— welder: hard hat, overalls ——— */}
      <g>
        <rect x="34" y="120" width="52" height="72" rx="16" fill="#1c1410" stroke="#1c1410" strokeWidth="3" />
        <rect x="46" y="140" width="28" height="30" rx="6" fill="#fff6ec" stroke="#1c1410" strokeWidth="3" />
        <rect x="28" y="126" width="14" height="42" rx="7" fill="#1c1410" />
        <rect x="78" y="126" width="14" height="42" rx="7" fill="#1c1410" />
        <rect x="42" y="188" width="14" height="26" rx="7" fill="#1c1410" />
        <rect x="64" y="188" width="14" height="26" rx="7" fill="#1c1410" />
        <circle cx="60" cy="96" r="22" fill="#e8b98a" stroke="#1c1410" strokeWidth="3" />
        <path d="M36 92 Q36 70 60 70 Q84 70 84 92 L84 96 L36 96 Z" fill="#c8f000" stroke="#1c1410" strokeWidth="3" />
        <rect x="52" y="64" width="16" height="8" rx="4" fill="#c8f000" stroke="#1c1410" strokeWidth="3" />
        <circle cx="53" cy="100" r="2.6" fill="#1c1410" />
        <circle cx="67" cy="100" r="2.6" fill="#1c1410" />
        <path d="M54 110 Q60 114 66 110" fill="none" stroke="#1c1410" strokeWidth="2.6" strokeLinecap="round" />
      </g>

      {/* ——— coder: waving, laptop ——— */}
      <g>
        <rect x="126" y="122" width="52" height="70" rx="16" fill="#6b4eff" stroke="#1c1410" strokeWidth="3" />
        <path d="M178 136 Q198 122 202 100" fill="none" stroke="#6b4eff" strokeWidth="13" strokeLinecap="round" />
        <circle cx="203" cy="96" r="8" fill="#8a5a3b" stroke="#1c1410" strokeWidth="3" />
        <rect x="118" y="130" width="14" height="40" rx="7" fill="#6b4eff" stroke="#1c1410" strokeWidth="3" />
        <rect x="108" y="164" width="42" height="26" rx="4" fill="#fff6ec" stroke="#1c1410" strokeWidth="3" />
        <rect x="114" y="170" width="30" height="4" rx="2" fill="#00c2d1" />
        <rect x="114" y="178" width="20" height="4" rx="2" fill="#ff5d3b" />
        <rect x="134" y="188" width="14" height="26" rx="7" fill="#1c1410" />
        <rect x="156" y="188" width="14" height="26" rx="7" fill="#1c1410" />
        <circle cx="152" cy="98" r="22" fill="#8a5a3b" stroke="#1c1410" strokeWidth="3" />
        <path d="M130 92 Q132 72 152 72 Q172 72 174 92 Q164 84 152 84 Q140 84 130 92 Z" fill="#1c1410" />
        <circle cx="145" cy="101" r="2.6" fill="#1c1410" />
        <circle cx="159" cy="101" r="2.6" fill="#1c1410" />
        <path d="M146 111 Q152 116 158 111" fill="none" stroke="#1c1410" strokeWidth="2.6" strokeLinecap="round" />
      </g>

      {/* ——— chef: hat + apron ——— */}
      <g>
        <rect x="220" y="122" width="52" height="70" rx="16" fill="#00c2d1" stroke="#1c1410" strokeWidth="3" />
        <path d="M232 128 L260 128 L256 186 L236 186 Z" fill="#fff6ec" stroke="#1c1410" strokeWidth="3" />
        <rect x="212" y="128" width="14" height="42" rx="7" fill="#00c2d1" stroke="#1c1410" strokeWidth="3" />
        <rect x="266" y="128" width="14" height="42" rx="7" fill="#00c2d1" stroke="#1c1410" strokeWidth="3" />
        <rect x="228" y="188" width="14" height="26" rx="7" fill="#1c1410" />
        <rect x="250" y="188" width="14" height="26" rx="7" fill="#1c1410" />
        <circle cx="246" cy="98" r="22" fill="#d99a6c" stroke="#1c1410" strokeWidth="3" />
        <path d="M228 88 Q224 66 244 64 Q246 54 258 58 Q272 56 270 70 Q276 82 264 88 Z" fill="#fff6ec" stroke="#1c1410" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="239" cy="101" r="2.6" fill="#1c1410" />
        <circle cx="253" cy="101" r="2.6" fill="#1c1410" />
        <path d="M240 111 Q246 115 252 111" fill="none" stroke="#1c1410" strokeWidth="2.6" strokeLinecap="round" />
      </g>

      {/* ——— student: bun + backpack straps + books ——— */}
      <g>
        <rect x="312" y="126" width="48" height="66" rx="15" fill="#c8f000" stroke="#1c1410" strokeWidth="3" />
        <path d="M320 130 L326 168 M352 130 L346 168" stroke="#1c1410" strokeWidth="4" strokeLinecap="round" />
        <rect x="304" y="132" width="13" height="38" rx="6.5" fill="#c8f000" stroke="#1c1410" strokeWidth="3" />
        <rect x="296" y="160" width="30" height="9" rx="2" fill="#ff5d3b" stroke="#1c1410" strokeWidth="2.5" />
        <rect x="298" y="151" width="30" height="9" rx="2" fill="#6b4eff" stroke="#1c1410" strokeWidth="2.5" />
        <rect x="322" y="188" width="13" height="26" rx="6.5" fill="#1c1410" />
        <rect x="342" y="188" width="13" height="26" rx="6.5" fill="#1c1410" />
        <circle cx="336" cy="102" r="21" fill="#6e4428" stroke="#1c1410" strokeWidth="3" />
        <circle cx="336" cy="74" r="9" fill="#1c1410" />
        <path d="M315 96 Q318 78 336 78 Q354 78 357 96 Q348 88 336 88 Q324 88 315 96 Z" fill="#1c1410" />
        <circle cx="329" cy="105" r="2.6" fill="#1c1410" />
        <circle cx="343" cy="105" r="2.6" fill="#1c1410" />
        <path d="M330 114 Q336 118 342 114" fill="none" stroke="#1c1410" strokeWidth="2.6" strokeLinecap="round" />
      </g>

      {/* ——— the bowerbird, perched with the crew ——— */}
      <g transform="translate(180, 168) scale(0.16)">
        <path d="M150 244 L116 300 L150 282 L184 300 Z" fill="#1c1410" />
        <ellipse cx="150" cy="222" rx="60" ry="66" fill="#1c1410" />
        <ellipse cx="150" cy="238" rx="33" ry="39" fill="#c8f000" />
        <circle cx="150" cy="134" r="43" fill="#1c1410" />
        <circle cx="166" cy="128" r="13" fill="#fff6ec" />
        <circle cx="169" cy="130" r="6.5" fill="#1c1410" />
        <path d="M191 132 L217 138 L191 147 Z" fill="#c8f000" />
      </g>
    </svg>
  );
}
