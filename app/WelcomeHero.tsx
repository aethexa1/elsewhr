"use client";

// elsewhr — welcome hero: the nest and the evidence that hangs from it
// Replaces app/WelcomeHero.tsx
// Self-contained: strings for all six languages live in this file.

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";

type HeroStrings = {
  kicker: string;
  h1a: string;
  h1b: string;
  audiences: string[];
  sub: string;
  cta: string;
  whisper: string;
  loginLine: string;
  vouched: string;
  dayOne: string;
};

const STRINGS: Record<string, HeroStrings> = {
  en: {
    kicker: "a new kind of network",
    h1a: "no résumé.",
    h1b: "just proof.",
    audiences: ["for welders", "for drivers", "for warehouse leads", "for students", "for the self-taught", "for anyone starting over"],
    sub: "photos of real work. real numbers. people who vouch for you — by name.",
    cta: "build your page — it's free",
    whisper: "starting from zero counts here. that's day one.",
    loginLine: "already have a page? log in →",
    vouched: "vouched",
    dayOne: "day one",
  },
  es: {
    kicker: "una red de otro tipo",
    h1a: "sin currículum.",
    h1b: "solo pruebas.",
    audiences: ["para soldadores", "para conductores", "para jefes de almacén", "para estudiantes", "para autodidactas", "para quien empieza de nuevo"],
    sub: "fotos de trabajo real. números reales. gente que responde por ti — con nombre y cara.",
    cta: "crea tu página — es gratis",
    whisper: "empezar desde cero cuenta aquí. eso es el día uno.",
    loginLine: "¿ya tienes tu página? inicia sesión →",
    vouched: "avalado",
    dayOne: "día uno",
  },
  pt: {
    kicker: "uma rede de outro tipo",
    h1a: "sem currículo.",
    h1b: "só provas.",
    audiences: ["para soldadores", "para motoristas", "para líderes de armazém", "para estudantes", "para autodidatas", "para quem está recomeçando"],
    sub: "fotos de trabalho real. números reais. pessoas que respondem por você — com nome e rosto.",
    cta: "crie sua página — é grátis",
    whisper: "começar do zero conta aqui. isso é o dia um.",
    loginLine: "já tem sua página? entrar →",
    vouched: "endossado",
    dayOne: "dia um",
  },
  hi: {
    kicker: "एक नए तरह का नेटवर्क",
    h1a: "रिज़्यूमे नहीं।",
    h1b: "सिर्फ़ सबूत।",
    audiences: ["वेल्डरों के लिए", "ड्राइवरों के लिए", "वेयरहाउस लीड्स के लिए", "छात्रों के लिए", "खुद से सीखने वालों के लिए", "नई शुरुआत करने वालों के लिए"],
    sub: "असली काम की तस्वीरें। असली आँकड़े। लोग जो आपके लिए ज़मानत देते हैं — नाम के साथ।",
    cta: "अपना पेज बनाइए — मुफ़्त है",
    whisper: "शून्य से शुरुआत यहाँ मायने रखती है। यही है दिन एक।",
    loginLine: "पहले से पेज है? लॉग इन करें →",
    vouched: "ज़मानत",
    dayOne: "दिन एक",
  },
  pl: {
    kicker: "sieć innego rodzaju",
    h1a: "bez CV.",
    h1b: "same dowody.",
    audiences: ["dla spawaczy", "dla kierowców", "dla liderów magazynu", "dla studentów", "dla samouków", "dla zaczynających od nowa"],
    sub: "zdjęcia prawdziwej pracy. prawdziwe liczby. ludzie, którzy za ciebie ręczą — z imienia.",
    cta: "stwórz swoją stronę — za darmo",
    whisper: "start od zera tu się liczy. to jest dzień pierwszy.",
    loginLine: "masz już swoją stronę? zaloguj się →",
    vouched: "poręczone",
    dayOne: "dzień 1",
  },
  fr: {
    kicker: "un réseau d'un autre genre",
    h1a: "pas de CV.",
    h1b: "que des preuves.",
    audiences: ["pour les soudeurs", "pour les chauffeurs", "pour les chefs d'entrepôt", "pour les étudiants", "pour les autodidactes", "pour ceux qui repartent à zéro"],
    sub: "des photos de vrai travail. de vrais chiffres. des gens qui se portent garants — avec leur nom.",
    cta: "crée ta page — c'est gratuit",
    whisper: "partir de zéro compte ici. c'est le jour un.",
    loginLine: "tu as déjà ta page ? connecte-toi →",
    vouched: "garanti",
    dayOne: "jour un",
  },
};

export default function WelcomeHero() {
  const { lang } = useLang();
  const s = STRINGS[lang] || STRINGS.en;
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [animating, setAnimating] = useState(false);

  // the pick: threads retract into the nest, the word swaps, everything pours back down
  const cycle = (dir: number) => {
    if (animating) return;
    setAnimating(true);
    setPhase("out");
    setTimeout(() => {
      const n = STRINGS.en.audiences.length;
      setIdx((i) => (i + dir + n) % n);
      setPhase("in");
      setTimeout(() => setAnimating(false), 950);
    }, 480);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      cycle(1);
    }, 5200);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animating]);

  return (
    <section className="w-full grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-8 md:gap-6 items-center">
      <style>{`
        @keyframes whSway { 0%,100% { transform: rotate(-3deg);} 50% { transform: rotate(3deg);} }
        @keyframes whRise { from { opacity:0; transform: translateY(26px);} to { opacity:1; transform:none;} }
        @keyframes whPour {
          0% { opacity:0; transform: translateY(-96px); }
          70% { opacity:1; transform: translateY(7px); }
          100% { opacity:1; transform: translateY(0); }
        }
        @keyframes whRetract { from { opacity:1; transform: translateY(0);} to { opacity:0; transform: translateY(-96px);} }
        @keyframes whWordDrop {
          0% { opacity:0; transform: translateY(-24px); }
          70% { opacity:1; transform: translateY(4px); }
          100% { opacity:1; transform: translateY(0); }
        }
        @keyframes whWordUp { from { opacity:1; transform: translateY(0);} to { opacity:0; transform: translateY(-20px);} }
        @keyframes whSettleBird {
          0% { opacity:0; transform: translateY(-56px); }
          65% { opacity:1; transform: translateY(6px); }
          100% { opacity:1; transform: translateY(0); }
        }
        .whSway { animation: whSway 4.5s ease-in-out infinite; transform-origin: top center; }
        .whRise { animation: whRise .85s cubic-bezier(.22,.61,.36,1) both; animation-delay: var(--wh-d, 0ms); }
        .whPour { animation: whPour .95s cubic-bezier(.3,1,.4,1) both; animation-delay: var(--wh-d, 0ms); }
        .whRetract { animation: whRetract .45s cubic-bezier(.5,0,.8,.4) both; animation-delay: var(--wh-r, 0ms); }
        .whWordDrop { animation: whWordDrop .6s cubic-bezier(.3,1,.4,1) both; }
        .whWordUp { animation: whWordUp .4s ease-in both; }
        .whBirdIn { animation: whSettleBird 1s cubic-bezier(.3,1,.4,1) both; animation-delay: 150ms; }
        @media (prefers-reduced-motion: reduce) {
          .whSway, .whRise, .whPour, .whRetract, .whWordDrop, .whWordUp, .whBirdIn { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* words */}
      <div className="text-center md:text-left">
        <p className="whRise font-mono text-[12px] uppercase tracking-[0.22em] text-[#fff6ec]/80 mb-4" style={{ "--wh-d": "250ms" } as CSSProperties}>
          {s.kicker}
        </p>
        <h1 className="whRise font-[Syne] font-extrabold text-[#fff6ec] leading-[0.98] tracking-[-0.02em] text-5xl sm:text-6xl md:text-7xl" style={{ "--wh-d": "450ms" } as CSSProperties}>
          {s.h1a}
          <br />
          <span className="text-[#c8f000]">{s.h1b}</span>
        </h1>

        {/* rotating audience line, destination-switcher style */}
        <div className="whRise mt-5 flex items-center justify-center md:justify-start gap-3" style={{ "--wh-d": "900ms" } as CSSProperties}>
          <button type="button" onClick={() => cycle(-1)} aria-label="previous" className="w-9 h-9 rounded-full border-[3px] border-[#fff6ec]/70 text-[#fff6ec] font-bold leading-none hover:bg-[#fff6ec]/10 transition-colors">
            ‹
          </button>
          <span key={String(idx) + phase} className={(phase === "in" ? "whWordDrop" : "whWordUp") + " inline-block min-w-[220px] text-center md:text-left font-[Syne] font-bold text-xl md:text-2xl text-[#fff6ec]"}>
            {s.audiences[idx]}
          </span>
          <button type="button" onClick={() => cycle(1)} aria-label="next" className="w-9 h-9 rounded-full border-[3px] border-[#fff6ec]/70 text-[#fff6ec] font-bold leading-none hover:bg-[#fff6ec]/10 transition-colors">
            ›
          </button>
        </div>

        <p className="whRise mt-5 text-[16px] md:text-[17px] leading-relaxed text-[#fff6ec]/95 max-w-md mx-auto md:mx-0" style={{ "--wh-d": "1250ms" } as CSSProperties}>
          {s.sub}
        </p>

        <div className="whRise mt-7" style={{ "--wh-d": "1550ms" } as CSSProperties}>
          <Link href="/login" className="inline-block px-7 py-4 rounded-2xl bg-[#c8f000] text-[#1c1410] font-[Syne] font-extrabold text-[17px] border-[3px] border-[#1c1410] shadow-[6px_6px_0_#1c1410] hover:translate-y-[-3px] hover:shadow-[8px_9px_0_#1c1410] active:translate-y-0 active:shadow-[3px_3px_0_#1c1410] transition-all duration-150">
            {s.cta}
          </Link>
        </div>

        <p className="whRise mt-4" style={{ "--wh-d": "1800ms" } as CSSProperties}>
          <Link href="/login" className="inline-block font-mono text-[13px] font-bold text-[#fff6ec] underline underline-offset-4 decoration-2 decoration-[#c8f000] hover:text-[#c8f000] transition-colors">
            {s.loginLine}
          </Link>
        </p>

        <p className="whRise mt-5 font-mono text-[11.5px] tracking-wide text-[#fff6ec]/75" style={{ "--wh-d": "2050ms" } as CSSProperties}>
          {s.whisper}
        </p>
      </div>

      {/* the nest: the bird on its collection, evidence hanging beneath */}
      <div className="relative mx-auto w-full max-w-[380px]" aria-hidden>
        <div className="whBirdIn relative z-10 flex justify-center">
          <HeroBird />
        </div>

        {/* woven nest arc */}
        <div className="whRise relative z-10 -mt-3 flex justify-center" style={{ "--wh-d": "350ms" } as CSSProperties}>
          <svg width="300" height="64" viewBox="0 0 300 64">
            <path d="M10 14 Q150 74 290 14" fill="none" stroke="#1c1410" strokeWidth="10" strokeLinecap="round" />
            <path d="M26 10 Q150 60 274 10" fill="none" stroke="#fff6ec" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 10" opacity="0.9" />
            <path d="M44 8 Q150 48 256 8" fill="none" stroke="#c8f000" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 12" opacity="0.9" />
          </svg>
        </div>

        {/* hanging evidence threads */}
        <div key={"drape-" + String(idx) + phase} className="relative z-0 -mt-2 flex justify-center items-start gap-5 sm:gap-7">
          <div className={phase === "in" ? "whPour" : "whRetract"} style={{ "--wh-d": "700ms", "--wh-r": "90ms" } as CSSProperties}>
            <div className="whSway flex flex-col items-center" style={{ animationDelay: "0s", animationDuration: "4.2s" }}>
            <div className="w-px h-14 border-l-2 border-dashed border-[#fff6ec]/80" />
            <div className="w-16 h-16 rounded-xl bg-[#fff6ec] border-[3px] border-[#1c1410] shadow-[4px_4px_0_#1c1410] flex items-center justify-center overflow-hidden">
              <svg width="34" height="34" viewBox="0 0 40 40">
                <rect x="3" y="10" width="34" height="26" rx="4" fill="#00c2d1" stroke="#1c1410" strokeWidth="2.5" />
                <rect x="13" y="4" width="14" height="9" rx="3" fill="#00c2d1" stroke="#1c1410" strokeWidth="2.5" />
                <circle cx="20" cy="23" r="7" fill="#fff6ec" stroke="#1c1410" strokeWidth="2.5" />
              </svg>
            </div>
            </div>
          </div>

          <div className={phase === "in" ? "whPour" : "whRetract"} style={{ "--wh-d": "850ms", "--wh-r": "0ms" } as CSSProperties}>
            <div className="whSway flex flex-col items-center pt-4" style={{ animationDelay: "0.7s", animationDuration: "5.1s" }}>
            <div className="w-px h-20 border-l-2 border-dashed border-[#fff6ec]/80" />
            <div className="px-3 py-2 rounded-xl bg-[#fff6ec] border-[3px] border-[#1c1410] shadow-[4px_4px_0_#1c1410] font-mono text-[12px] font-bold text-[#1c1410] whitespace-nowrap">
              3,000 ▲
            </div>
            </div>
          </div>

          <div className={phase === "in" ? "whPour" : "whRetract"} style={{ "--wh-d": "1000ms", "--wh-r": "140ms" } as CSSProperties}>
            <div className="whSway flex flex-col items-center" style={{ animationDelay: "1.4s", animationDuration: "4.7s" }}>
            <div className="w-px h-10 border-l-2 border-dashed border-[#fff6ec]/80" />
            <div className="px-3 py-2 rounded-xl bg-[#c8f000] border-[3px] border-[#1c1410] shadow-[4px_4px_0_#1c1410] font-mono text-[12px] font-bold text-[#1c1410] whitespace-nowrap">
              ✓ {s.vouched}
            </div>
            </div>
          </div>

          <div className={phase === "in" ? "whPour" : "whRetract"} style={{ "--wh-d": "1150ms", "--wh-r": "50ms" } as CSSProperties}>
            <div className="whSway flex flex-col items-center pt-6" style={{ animationDelay: "0.3s", animationDuration: "5.6s" }}>
            <div className="w-px h-16 border-l-2 border-dashed border-[#fff6ec]/80" />
            <div className="px-3 py-2 rounded-xl bg-[#6b4eff] border-[3px] border-[#1c1410] shadow-[4px_4px_0_#1c1410] font-mono text-[12px] font-bold text-[#fff6ec] whitespace-nowrap">
              {s.dayOne} ◦
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroBird() {
  return (
    <svg width="150" height="170" viewBox="0 0 300 340" xmlns="http://www.w3.org/2000/svg">
      <path d="M150 244 L116 300 L150 282 L184 300 Z" fill="#1c1410" />
      <ellipse cx="150" cy="222" rx="60" ry="66" fill="#1c1410" />
      <ellipse cx="150" cy="238" rx="33" ry="39" fill="#c8f000" />
      <circle cx="150" cy="134" r="43" fill="#1c1410" />
      <path d="M150 92 Q141 66 150 52 Q159 66 150 92" fill="#c8f000" />
      <path d="M150 94 Q133 76 128 62 Q151 70 150 94" fill="#c8f000" />
      <path d="M150 94 Q167 76 172 62 Q149 70 150 94" fill="#c8f000" />
      <circle cx="166" cy="128" r="13" fill="#fff6ec" />
      <circle cx="169" cy="130" r="6.5" fill="#1c1410" />
      <circle cx="171" cy="127" r="2.2" fill="#fff6ec" />
      <path d="M191 132 L217 138 L191 147 Z" fill="#c8f000" />
      <rect x="135" y="284" width="5" height="20" rx="2.5" fill="#c8f000" />
      <rect x="160" y="284" width="5" height="20" rx="2.5" fill="#c8f000" />
    </svg>
  );
}
