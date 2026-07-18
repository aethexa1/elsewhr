"use client";

// elsewhr — home shell: welcome screen for guests, feed for members
// Replaces app/HomeShell.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import HeaderActions from "./HeaderActions";
import WelcomeHero from "./WelcomeHero";
import LangPicker from "./LangPicker";
import CurvedMarquee from "./CurvedMarquee";
import ProfileCoverflow from "./ProfileCoverflow";
import { useLang, t } from "@/lib/i18n";

export type FeedProfile = {
  id: number;
  user_id?: string | null;
  name: string;
  photo?: string | null;
  headline: string;
  location: string;
  seeking?: string | null;
  mindset?: string[] | null;
  accent?: string | null;
  dest_place?: string | null;
  dest_term?: string | null;
  artifacts: { image?: string }[] | null;
};

// two worlds, one universe: connect is the front door, work stands behind it
const MARQUEE_STRINGS: Record<string, string> = {
  en: "you got in · now you know nobody there · elsewhr · ",
  es: "entraste · y no conoces a nadie allá · elsewhr · ",
  pt: "você entrou · e não conhece ninguém lá · elsewhr · ",
  hi: "एडमिशन मिल गया · वहाँ किसी को नहीं जानते · elsewhr · ",
  pl: "dostałeś się · nikogo tam nie znasz · elsewhr · ",
  fr: "t'es admis · tu ne connais personne là-bas · elsewhr · ",
};

const UNIVERSE_STRINGS: Record<string, { connect: string; work: string; headedTo: string }> = {
  en: { connect: "connect", work: "work", headedTo: "→ " },
  es: { connect: "conectar", work: "trabajo", headedTo: "→ " },
  pt: { connect: "conectar", work: "trabalho", headedTo: "→ " },
  hi: { connect: "जुड़ो", work: "काम", headedTo: "→ " },
  pl: { connect: "połącz", work: "praca", headedTo: "→ " },
  fr: { connect: "connecter", work: "travail", headedTo: "→ " },
};

const WORLD_STRINGS: Record<string, { everywhere: string; also: string; early: string }> = {
  en: { everywhere: "everywhere", also: "✦ also heading to {place}", early: "{n} in your world so far — you're early." },
  es: { everywhere: "en todas partes", also: "✦ también va a {place}", early: "{n} en tu mundo por ahora — llegaste temprano." },
  pt: { everywhere: "em todo lugar", also: "✦ também vai para {place}", early: "{n} no seu mundo por enquanto — você chegou cedo." },
  hi: { everywhere: "सब जगह", also: "✦ {place} भी जा रहे हैं", early: "आपकी दुनिया में अभी {n} — आप जल्दी आए हैं।" },
  pl: { everywhere: "wszędzie", also: "✦ też zmierza do {place}", early: "{n} w twoim świecie na razie — jesteś wcześnie." },
  fr: { everywhere: "partout", also: "✦ va aussi à {place}", early: "{n} dans ton monde pour l'instant — tu es en avance." },
};

const PEEK_STRINGS: Record<string, { cta: string; reveal: string; stats: string; youd: string; lock: string; joinAll: string }> = {
  en: { cta: "show me the proof", reveal: "the proof, so far —", stats: "real people: {n} · résumés: 0", youd: "you'd be", lock: "join to see their proof", joinAll: "see it all — it's free" },
  es: { cta: "muéstrame las pruebas", reveal: "las pruebas, hasta ahora —", stats: "personas reales: {n} · currículums: 0", youd: "serías", lock: "únete para ver sus pruebas", joinAll: "míralo todo — es gratis" },
  pt: { cta: "me mostra as provas", reveal: "as provas, até agora —", stats: "pessoas reais: {n} · currículos: 0", youd: "você seria", lock: "entre para ver as provas", joinAll: "veja tudo — é grátis" },
  hi: { cta: "मुझे सबूत दिखाओ", reveal: "अब तक के सबूत —", stats: "असली लोग: {n} · रिज़्यूमे: 0", youd: "आप होंगे", lock: "सबूत देखने के लिए जुड़ें", joinAll: "सब देखें — मुफ़्त है" },
  pl: { cta: "pokaż mi dowody", reveal: "dowody, jak dotąd —", stats: "prawdziwi ludzie: {n} · CV: 0", youd: "będziesz", lock: "dołącz, by zobaczyć dowody", joinAll: "zobacz wszystko — za darmo" },
  fr: { cta: "montre-moi les preuves", reveal: "les preuves, jusqu'ici —", stats: "vraies personnes : {n} · CV : 0", youd: "tu serais", lock: "rejoins pour voir les preuves", joinAll: "vois tout — c'est gratuit" },
};

export default function HomeShell({
  profiles,
  hadError,
}: {
  profiles: FeedProfile[];
  hadError: boolean;
}) {
  const { lang } = useLang();
  const pk = PEEK_STRINGS[lang] || PEEK_STRINGS.en;
  const wd = WORLD_STRINGS[lang] || WORLD_STRINGS.en;
  const uv = UNIVERSE_STRINGS[lang] || UNIVERSE_STRINGS.en;
  const [mode, setMode] = useState<"loading" | "guest" | "member">("loading");
  const [peek, setPeek] = useState(false);
  const [myTags, setMyTags] = useState<string[]>([]);
  const [myProfileId, setMyProfileId] = useState<number | null>(null);
  const [blockedIds, setBlockedIds] = useState<Set<number>>(new Set());
  const [myDest, setMyDest] = useState("");
  const [world, setWorld] = useState<"mine" | "all">("all");
  const [universe, setUniverse] = useState<"connect" | "work">("connect");
  const [knockCount, setKnockCount] = useState(0);

  useEffect(() => {
    try {
      const savedU = localStorage.getItem("wh_universe");
      if (savedU === "work") setUniverse("work");
    } catch { /* private mode */ }
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setMode("guest");
        return;
      }
      setMode("member");
      const { data: mine } = await supabase
        .from("profiles")
        .select("id, mindset, dest_place")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();
      if (mine) {
        setMyProfileId(mine.id);
        setMyTags(Array.isArray(mine.mindset) ? mine.mindset : []);
        if (mine.dest_place && String(mine.dest_place).trim()) {
          setMyDest(String(mine.dest_place).trim());
          let saved: string | null = null;
          try { saved = localStorage.getItem("wh_world"); } catch { saved = null; }
          setWorld(saved === "all" ? "all" : "mine");
        }
      }
      // knocks waiting at the door
      const { count: kc } = await supabase
        .from("reach_requests")
        .select("id", { count: "exact", head: true })
        .eq("recipient_user_id", data.user.id)
        .eq("status", "pending");
      if (kc && kc > 0) setKnockCount(kc);

      // safety: people you've blocked never appear in your feed
      const { data: blocks } = await supabase
        .from("blocks")
        .select("blocked_profile_id")
        .eq("blocker_user_id", data.user.id);
      if (blocks && blocks.length > 0) {
        setBlockedIds(new Set(blocks.map((b) => b.blocked_profile_id as number)));
      }
    });
  }, []);

  const showFeed = mode === "member" || (mode === "guest" && peek);

  // never-inflate applies to counting too: only real accounts count
  const realCount = profiles.filter((p) => !!p.user_id).length;

  // real faces for the guest coverflow — only real accounts with photos
  const coverSlides = profiles
    .filter((p) => !!p.user_id && !!p.photo)
    .slice(0, 8)
    .map((p) => ({
      photo: p.photo as string,
      name: p.name,
      line: p.dest_place && p.dest_place.trim() ? "→ " + p.dest_place.trim() : undefined,
    }));

  // matching-lite: people who share your mindset rise to the top
  const shared = (p: FeedProfile) =>
    myTags.length && Array.isArray(p.mindset)
      ? p.mindset.filter((t) => myTags.includes(t))
      : [];

  // your own card lives under "me ▾ → My profile", not in the feed
  const others = (
    mode === "member" && myProfileId
      ? profiles.filter((p) => p.id !== myProfileId)
      : profiles
  ).filter((p) => !blockedIds.has(p.id));
  // their own world: same destination rises to the top; nobody is ever filtered out
  const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
  const inCohort = (p: FeedProfile) =>
    Boolean(myDest) && norm(p.dest_place) === norm(myDest);
  const scoping = mode === "member" && world === "mine" && Boolean(myDest);
  const cohortCount = scoping ? others.filter(inCohort).length : 0;

  const ordered =
    mode === "member"
      ? [...others].sort((a, b) => {
          if (scoping) {
            const ca = inCohort(a) ? 1 : 0;
            const cb = inCohort(b) ? 1 : 0;
            if (cb !== ca) return cb - ca;
          }
          return shared(b).length - shared(a).length || b.id - a.id;
        })
      : others;

  const toggleWorld = () => {
    setWorld((w) => {
      const next = w === "mine" ? "all" : "mine";
      try { localStorage.setItem("wh_world", next); } catch { /* private mode */ }
      return next;
    });
  };
  const pickUniverse = (u: "connect" | "work") => {
    setUniverse(u);
    try { localStorage.setItem("wh_universe", u); } catch { /* private mode */ }
  };
  const shortDest = myDest.length > 16 ? myDest.slice(0, 15).trimEnd() + "…" : myDest;

  return (
    <main className="relative min-h-screen bg-[#ff5d3b] text-[#1c1410] flex justify-center px-4 py-8 overflow-hidden">
      <style>{`
        @keyframes rise { from { opacity:0; transform:translateY(26px);} to { opacity:1; transform:none;} }
        @keyframes drift1 { 0%,100% { transform:translate(0,0) scale(1);} 50% { transform:translate(60px,-45px) scale(1.12);} }
        @keyframes drift2 { 0%,100% { transform:translate(0,0) scale(1);} 50% { transform:translate(-70px,35px) scale(0.9);} }
        @keyframes bob { 0%,100% { transform:translateY(0);} 50% { transform:translateY(-7px);} }
        @keyframes waveShift { from { transform:translateX(0);} to { transform:translateX(-50%);} }
        @keyframes windX {
          0%   { transform: translate(-8vw, 0) rotate(0deg); opacity:0; }
          8%   { opacity:.7; }
          92%  { opacity:.7; }
          100% { transform: translate(108vw, -22vh) rotate(240deg); opacity:0; }
        }
        .rise { animation: rise .55s cubic-bezier(.2,.7,.3,1) both; }
        .chapter { animation: rise .55s cubic-bezier(.2,.7,.3,1) both; }
        .bob { animation: bob 3.2s ease-in-out infinite; }
        .leaf { position:absolute; pointer-events:none; animation: windX linear infinite; }
        @media (prefers-reduced-motion: reduce) { .rise,.bob,.blob,.wave,.leaf,.chapter { animation:none !important; opacity:1 !important; } }
      `}</style>

      {/* depth vignette */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 20%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0) 40%, rgba(28,20,16,0.16) 100%)" }} />

      {/* side doodles — the elsewhr symbols, desktop only */}
      <div aria-hidden className="hidden lg:block absolute left-8 top-44 opacity-90">
        <svg width="92" height="80" viewBox="0 0 120 104">
          <path d="M24 30 L60 78 M96 30 L60 78 M24 30 L96 30" stroke="#fff6ec" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="1 9" opacity="0.9"/>
          <circle cx="24" cy="30" r="13" fill="#c8f000" stroke="#1c1410" strokeWidth="3"/>
          <circle cx="96" cy="30" r="13" fill="#6b4eff" stroke="#1c1410" strokeWidth="3"/>
          <circle cx="60" cy="78" r="13" fill="#fff6ec" stroke="#1c1410" strokeWidth="3"/>
        </svg>
      </div>
      <div aria-hidden className="hidden lg:block absolute left-10 bottom-36" style={{ animation: "bob 5s ease-in-out infinite" }}>
        <svg width="104" height="66" viewBox="0 0 140 90">
          <circle cx="14" cy="78" r="8" fill="#c8f000" stroke="#1c1410" strokeWidth="2.5"/>
          <circle cx="30" cy="44" r="8" fill="#00c2d1" stroke="#1c1410" strokeWidth="2.5"/>
          <circle cx="52" cy="20" r="8" fill="#fff6ec" stroke="#1c1410" strokeWidth="2.5"/>
          <circle cx="78" cy="14" r="8" fill="#6b4eff" stroke="#1c1410" strokeWidth="2.5"/>
          <circle cx="104" cy="26" r="8" fill="#c8f000" stroke="#1c1410" strokeWidth="2.5"/>
          <circle cx="122" cy="54" r="8" fill="#fff6ec" stroke="#1c1410" strokeWidth="2.5"/>
          <circle cx="130" cy="80" r="8" fill="#00c2d1" stroke="#1c1410" strokeWidth="2.5"/>
        </svg>
      </div>
      <div aria-hidden className="hidden lg:block absolute right-10 top-52" style={{ animation: "bob 3.6s ease-in-out infinite" }}>
        <svg width="60" height="68" viewBox="0 0 300 340">
          <path d="M150 244 L116 300 L150 282 L184 300 Z" fill="#1c1410"/>
          <ellipse cx="150" cy="222" rx="60" ry="66" fill="#1c1410"/>
          <ellipse cx="150" cy="238" rx="33" ry="39" fill="#c8f000"/>
          <circle cx="150" cy="134" r="43" fill="#1c1410"/>
          <circle cx="166" cy="128" r="13" fill="#fff6ec"/>
          <circle cx="169" cy="130" r="6.5" fill="#1c1410"/>
          <path d="M191 132 L217 138 L191 147 Z" fill="#c8f000"/>
        </svg>
      </div>
      <div aria-hidden className="hidden lg:block absolute right-12 top-[55%]" style={{ animation: "bob 4.4s ease-in-out infinite reverse" }}>
        <svg width="120" height="84" viewBox="0 0 160 112">
          <path d="M6 96 Q46 84 76 58 Q100 38 118 26" fill="none" stroke="#fff6ec" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="2 10" opacity="0.85"/>
          <path d="M118 8 L154 22 L124 52 L120 34 Z" fill="#c8f000" stroke="#1c1410" strokeWidth="3" strokeLinejoin="round"/>
          <path d="M118 8 L120 34 L106 40 Z" fill="#fff6ec" stroke="#1c1410" strokeWidth="3" strokeLinejoin="round"/>
        </svg>
      </div>
      <div aria-hidden className="hidden lg:block absolute right-20 bottom-32 opacity-90" style={{ animation: "bob 6s ease-in-out infinite" }}>
        <svg width="44" height="64" viewBox="0 0 60 90">
          <path d="M30 4 Q52 30 44 58 Q38 78 30 86 Q22 78 16 58 Q8 30 30 4 Z" fill="#6b4eff" stroke="#1c1410" strokeWidth="3" strokeLinejoin="round"/>
          <path d="M30 12 L30 82" stroke="#fff6ec" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* wind particles */}
      <div aria-hidden className="leaf top-[16%]" style={{ animationDuration: "13s", animationDelay: "0s" }}>
        <svg width="14" height="14" viewBox="0 0 20 20"><path d="M10 0 C16 6 16 14 10 20 C4 14 4 6 10 0 Z" fill="#c8f000" opacity="0.55"/></svg>
      </div>
      <div aria-hidden className="leaf top-[34%]" style={{ animationDuration: "19s", animationDelay: "3s" }}>
        <svg width="10" height="10" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#fff6ec" opacity="0.45"/></svg>
      </div>
      <div aria-hidden className="leaf top-[52%]" style={{ animationDuration: "16s", animationDelay: "7s" }}>
        <svg width="12" height="12" viewBox="0 0 20 20"><path d="M10 0 C16 6 16 14 10 20 C4 14 4 6 10 0 Z" fill="#00c2d1" opacity="0.5"/></svg>
      </div>
      <div aria-hidden className="leaf top-[68%]" style={{ animationDuration: "22s", animationDelay: "1.5s" }}>
        <svg width="9" height="9" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#c8f000" opacity="0.4"/></svg>
      </div>
      <div aria-hidden className="leaf top-[82%]" style={{ animationDuration: "15s", animationDelay: "9s" }}>
        <svg width="13" height="13" viewBox="0 0 20 20"><path d="M10 0 C16 6 16 14 10 20 C4 14 4 6 10 0 Z" fill="#fff6ec" opacity="0.5"/></svg>
      </div>
      <div aria-hidden className="leaf top-[8%]" style={{ animationDuration: "25s", animationDelay: "12s" }}>
        <svg width="8" height="8" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#6b4eff" opacity="0.45"/></svg>
      </div>

      {/* ambient blobs */}
      <div aria-hidden className="blob absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#c8f000] opacity-[0.18] blur-3xl" style={{ animation: "drift1 14s ease-in-out infinite" }} />
      <div aria-hidden className="blob absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-[#6b4eff] opacity-[0.19] blur-3xl" style={{ animation: "drift2 18s ease-in-out infinite" }} />
      <div aria-hidden className="blob absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-[#00c2d1] opacity-[0.15] blur-3xl" style={{ animation: "drift1 22s ease-in-out infinite reverse" }} />

      {/* waves */}
      <div aria-hidden className="absolute bottom-0 left-0 w-[200%] pointer-events-none" style={{ animation: "waveShift 16s linear infinite" }}>
        <svg viewBox="0 0 1440 70" className="w-1/2 inline-block align-bottom" preserveAspectRatio="none" height="64">
          <path d="M0,40 C240,70 480,10 720,40 C960,70 1200,10 1440,40 L1440,70 L0,70 Z" fill="#1c1410" opacity="0.22"/>
        </svg><svg viewBox="0 0 1440 70" className="w-1/2 inline-block align-bottom" preserveAspectRatio="none" height="64">
          <path d="M0,40 C240,70 480,10 720,40 C960,70 1200,10 1440,40 L1440,70 L0,70 Z" fill="#1c1410" opacity="0.22"/>
        </svg>
      </div>

      <div className="relative w-full max-w-[560px] md:max-w-[1080px]">
        {/* brand + action */}
        <div className="flex items-center justify-between mb-2">
          <div className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">
            elsewhr<span className="text-[#c8f000]">.</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {mode === "member" && knockCount > 0 && (
              <Link
                href="/knocks"
                className="px-3 py-1.5 rounded-full border-2 border-[#c8f000] bg-[#c8f000] text-[#1c1410] font-mono text-[11px] font-bold tracking-wide hover:translate-y-[-1px] transition-transform"
              >
                🐦 {knockCount}
              </Link>
            )}
            {mode === "member" && myDest && (
              <button
                type="button"
                onClick={toggleWorld}
                className="px-3 py-1.5 rounded-full border-2 border-[#fff6ec]/70 text-[#fff6ec] font-mono text-[11px] font-bold tracking-wide hover:bg-[#fff6ec]/10 transition-colors"
              >
                📍 {world === "mine" ? shortDest : wd.everywhere}
              </button>
            )}
            <LangPicker />
            <HeaderActions />
            <span className="bob inline-block"><Bird /></span>
          </div>
        </div>

        {mode === "loading" && (
          <p className="font-mono text-[12px] text-[#fff6ec]/70 mt-10 text-center">…</p>
        )}

        {/* GUEST: the welcome screen */}
        {mode === "guest" && (
          <>
            <div className="min-h-[55vh] flex items-center">
              <WelcomeHero />
            </div>
            <div className="-mx-4 mb-4">
              <CurvedMarquee text={MARQUEE_STRINGS[lang] || MARQUEE_STRINGS.en} />
            </div>
            {!peek && coverSlides.length >= 3 && (
              <div className="mb-8">
                <ProfileCoverflow slides={coverSlides} />
              </div>
            )}
            {!peek && (
              <div className="text-center mb-16">
                <button
                  onClick={() => setPeek(true)}
                  className="px-6 py-3.5 rounded-2xl border-[3px] border-[#fff6ec]/80 text-[#fff6ec] font-[Syne] font-bold text-[16px] hover:bg-[#fff6ec] hover:text-[#ff5d3b] transition-colors"
                >
                  {pk.cta} <span className="bob inline-block ml-1">↓</span>
                </button>
                {realCount > 0 && (
                  <div className="mt-4">
                    <p className="font-mono text-[12px] tracking-wide text-[#fff6ec]/85">
                      {pk.stats.replace("{n}", String(realCount))}
                    </p>
                    <p className="font-mono text-[12px] tracking-wide text-[#fff6ec]/85 mt-1">
                      {pk.youd} <span className="font-bold text-[#c8f000]">#{realCount + 1}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
            {peek && (
              <h2 className="rise font-[Syne] font-bold text-2xl text-[#fff6ec] mb-5">
                {pk.reveal}
              </h2>
            )}
          </>
        )}

        {/* their own world: honest early-days line */}
        {scoping && (
          <p className="rise font-mono text-[12px] text-[#fff6ec]/85 mb-4">
            {wd.early.replace("{n}", String(cohortCount))}
          </p>
        )}

        {/* MEMBER greeting */}
        {mode === "member" && (
          <p className="rise text-[#fff6ec]/90 text-[15px] mb-7 font-mono tracking-wide" style={{ animationDelay: "60ms" }}>
            {t(lang, "home.tagline")}
            {myTags.length > 0 && t(lang, "home.yourPeople")}
          </p>
        )}

        {/* TWO WORLDS, ONE UNIVERSE: the switcher */}
        {showFeed && (
          <div className="rise flex justify-center mb-6" style={{ animationDelay: "90ms" }}>
            <div className="inline-flex rounded-full border-[3px] border-[#1c1410] bg-[#fff6ec] p-1 shadow-[4px_4px_0_#1c1410]">
              <button type="button" onClick={() => pickUniverse("connect")}
                className={`px-5 py-2 rounded-full font-bold text-[13.5px] transition-all duration-150 ${universe === "connect" ? "bg-[#c8f000] border-2 border-[#1c1410]" : "border-2 border-transparent hover:bg-[#1c1410]/5"}`}
              >
                🤝 {uv.connect}
              </button>
              <button type="button" onClick={() => pickUniverse("work")}
                className={`px-5 py-2 rounded-full font-bold text-[13.5px] transition-all duration-150 ${universe === "work" ? "bg-[#c8f000] border-2 border-[#1c1410]" : "border-2 border-transparent hover:bg-[#1c1410]/5"}`}
              >
                💼 {uv.work}
              </button>
            </div>
          </div>
        )}

        {/* THE FEED */}
        {showFeed && (
          <>
            {hadError || ordered.length === 0 ? (
              <div className="bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl p-8 text-center">
                <p className="font-bold text-lg mb-2">{t(lang, "home.noProfiles")}</p>
                <p className="text-sm">
                  {t(lang, "home.beFirst")}{" "}
                  <Link href="/login" className="underline font-bold text-[#6b4eff]">
                    {t(lang, "home.join")}
                  </Link>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 items-start">
                {ordered.map((p, idx) => {
                  const workImage = p.artifacts?.find((a) => a.image)?.image;
                  const accent = p.accent || "#6b4eff";
                  const both = p.id === myProfileId ? [] : shared(p);

                  // guests get the velvet rope: real, but veiled — joining is how you look closer
                  if (mode === "guest") {
                    return (
                      <Link
                        key={p.id}
                        href="/login"
                        className="chapter block bg-[#fff6ec] rounded-3xl border-[3px] border-[#1c1410] shadow-[7px_7px_0_#1c1410,0_22px_44px_rgba(28,20,16,0.25)] overflow-hidden hover:translate-y-[-5px] hover:rotate-[-0.4deg] hover:shadow-[10px_13px_0_#1c1410,0_30px_60px_rgba(28,20,16,0.3)] active:translate-y-0 active:shadow-[4px_4px_0_#1c1410] transition-all duration-200"
                        style={{ animationDelay: `${idx * 90}ms` }}
                      >
                        <div style={{ background: accent }} className="h-2 w-full" />
                        <div className="p-5 flex items-center gap-4">
                          {p.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.photo}
                              alt=""
                              className="w-16 h-16 rounded-full object-cover border-[3px] flex-none blur-[7px] select-none" style={{ borderColor: accent }}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full text-[#fff6ec] flex items-center justify-center font-[Syne] font-extrabold text-2xl flex-none" style={{ background: accent }}>
                              {p.name?.[0] ?? "?"}
                            </div>
                          )}
                          <div className="min-w-0">
                            {!p.user_id && (
                              <span className="inline-block mb-1 px-2 py-0.5 rounded-full border border-[#1c1410]/40 bg-white font-mono text-[9.5px] uppercase tracking-wider text-[#6b5e52]">
                                {t(lang, "sample.badge")}
                              </span>
                            )}
                            <p className="font-[Syne] font-extrabold text-xl leading-tight truncate tracking-[-0.01em]">
                              {p.name.split(" ")[0]}
                            </p>
                            <p className="text-[13.5px] leading-snug text-[#3a2c20] line-clamp-2">
                              {p.headline}
                            </p>
                            {p.mindset && p.mindset.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {p.mindset.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 rounded-full text-[#fff6ec] text-[10.5px] font-medium" style={{ background: accent }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {workImage && (
                          <div className="relative overflow-hidden border-t-[3px] border-[#1c1410]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={workImage} alt="" className="w-full h-36 object-cover blur-md scale-110 select-none" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="px-3.5 py-2 rounded-full bg-[#1c1410] text-[#fff6ec] font-mono text-[11px] font-bold tracking-wide">
                                🔒 {pk.lock}
                              </span>
                            </div>
                          </div>
                        )}
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={p.id}
                      href={`/p/${p.id}`}
                      className="chapter block bg-[#fff6ec] rounded-3xl border-[3px] border-[#1c1410] shadow-[7px_7px_0_#1c1410,0_22px_44px_rgba(28,20,16,0.25)] overflow-hidden hover:translate-y-[-5px] hover:rotate-[-0.4deg] hover:shadow-[10px_13px_0_#1c1410,0_30px_60px_rgba(28,20,16,0.3)] active:translate-y-0 active:shadow-[4px_4px_0_#1c1410] transition-all duration-200"
                      style={{ animationDelay: `${idx * 90}ms` }}
                    >
                      <div style={{ background: accent }} className="h-2 w-full" />
                      <div className="p-5 flex items-center gap-4">
                        {p.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.photo}
                            alt={p.name}
                            className="w-16 h-16 rounded-full object-cover border-[3px] flex-none" style={{ borderColor: accent }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full text-[#fff6ec] flex items-center justify-center font-[Syne] font-extrabold text-2xl flex-none" style={{ background: accent }}>
                            {p.name?.[0] ?? "?"}
                          </div>
                        )}
                        <div className="min-w-0">
                          {!p.user_id && (
                            <span className="inline-block mb-1 px-2 py-0.5 rounded-full border border-[#1c1410]/40 bg-white font-mono text-[9.5px] uppercase tracking-wider text-[#6b5e52]">
                              {t(lang, "sample.badge")}
                            </span>
                          )}
                          <p className="font-[Syne] font-extrabold text-xl leading-tight truncate tracking-[-0.01em]">
                            {p.name}
                          </p>
                          {universe === "connect" && p.dest_place && p.dest_place.trim() ? (
                            <p className="text-[13.5px] leading-snug font-bold text-[#6b4eff] truncate">
                              {uv.headedTo}{p.dest_place.trim()}{p.dest_term && p.dest_term.trim() ? " · " + p.dest_term.trim() : ""}
                            </p>
                          ) : (
                            <p className="text-[13.5px] leading-snug text-[#3a2c20] line-clamp-2">
                              {p.headline}
                            </p>
                          )}
                          {p.mindset && p.mindset.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {p.mindset.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-full text-[#fff6ec] text-[10.5px] font-medium" style={{ background: accent }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {scoping && inCohort(p) && (
                            <p className="mt-1.5 font-mono text-[10.5px] font-bold text-[#6b4eff]">
                              {wd.also.replace("{place}", p.dest_place ? p.dest_place.trim() : myDest)}
                              {p.dest_term && p.dest_term.trim() ? " · " + p.dest_term.trim() : ""}
                            </p>
                          )}
                          {both.length > 0 && (
                            <p className="mt-1.5 font-mono text-[10.5px] text-[#6b5e52]">
                              {t(lang, "home.youBoth")} {both.slice(0, 3).join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>
                      {universe === "work" && workImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={workImage} alt="" className="w-full h-36 object-cover border-t-[3px] border-[#1c1410]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}

            {mode === "guest" ? (
              <div className="text-center mt-8 mb-4">
                <Link href="/login" className="inline-block px-7 py-4 rounded-2xl bg-[#c8f000] text-[#1c1410] font-[Syne] font-extrabold text-[16px] border-[3px] border-[#1c1410] shadow-[6px_6px_0_#1c1410] hover:translate-y-[-3px] hover:shadow-[8px_9px_0_#1c1410] active:translate-y-0 active:shadow-[3px_3px_0_#1c1410] transition-all duration-150">
                  {pk.joinAll}
                </Link>
              </div>
            ) : (
              <p className="font-mono text-[11px] text-[#fff6ec]/80 mt-8 text-center">
                {t(lang, "home.tapAnyone")}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Bird() {
  return (
    <svg width="44" height="49" viewBox="0 0 300 340" xmlns="http://www.w3.org/2000/svg">
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
