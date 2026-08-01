"use client";

// elsewhr — my week: the bird plans your days, and helps you find your things.
// New file: app/plan/page.tsx  ·  door: 🗓 my week on the home rack
// School + work + rest, balanced — then running club, yoga, fishing, near YOUR city.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";

type Block = { time: string; what: string; emoji?: string };
type Plan = { days: { day: string; blocks: Block[] }[]; tips?: string[] };

const S: Record<string, {
  title: string; sub: string; school: string; work: string; sleep: string; acts: string; notes: string;
  make: string; remake: string; thinking: string; things: string; thingsSub: string; near: string; back: string;
  meetup: string; groups: string; nearby: string; post: string;
}> = {
  en: {
    title: "my week", sub: "tell the bird your fixed hours — it balances school, work, rest, and your things.",
    school: "school / classes (e.g. mon-fri 9-12)", work: "work — hours you have or want (e.g. ~15h/week, evenings)",
    sleep: "sleep (e.g. 11pm-7am)", acts: "your things (e.g. running, yoga, fishing, gym)", notes: "anything else",
    make: "plan my week 🐦", remake: "replan", thinking: "the bird is planning…",
    things: "find your things", thingsSub: "clubs and groups near you — and when you find one, post it on that world's board.",
    near: "near", back: "← back to elsewhr",
    meetup: "on Meetup", groups: "Facebook groups", nearby: "search nearby", post: "post one on your world's board →",
  },
  es: { title: "mi semana", sub: "dile al pájaro tus horarios fijos — equilibra escuela, trabajo, descanso y lo tuyo.", school: "escuela / clases (ej. lun-vie 9-12)", work: "trabajo — horas que tienes o quieres", sleep: "sueño (ej. 11pm-7am)", acts: "tus cosas (correr, yoga, pesca…)", notes: "algo más", make: "planear mi semana 🐦", remake: "replanear", thinking: "el pájaro está planeando…", things: "encuentra lo tuyo", thingsSub: "clubes y grupos cerca — y cuando encuentres uno, publícalo en el tablón de ese mundo.", near: "cerca de", back: "← volver a elsewhr", meetup: "en Meetup", groups: "grupos de Facebook", nearby: "buscar cerca", post: "publica uno en el tablón de tu mundo →" },
  pt: { title: "minha semana", sub: "conte ao pássaro seus horários fixos — ele equilibra escola, trabalho, descanso e as suas coisas.", school: "escola / aulas (ex. seg-sex 9-12)", work: "trabalho — horas que tem ou quer", sleep: "sono (ex. 23h-7h)", acts: "suas coisas (corrida, yoga, pesca…)", notes: "algo mais", make: "planejar minha semana 🐦", remake: "replanejar", thinking: "o pássaro está planejando…", things: "encontre as suas coisas", thingsSub: "clubes e grupos perto — e quando achar um, poste no mural daquele mundo.", near: "perto de", back: "← voltar ao elsewhr", meetup: "no Meetup", groups: "grupos do Facebook", nearby: "buscar perto", post: "poste um no mural do seu mundo →" },
  hi: { title: "मेरा हफ़्ता", sub: "चिड़िया को अपने तय घंटे बताओ — वो पढ़ाई, काम, आराम और तुम्हारी चीज़ें संतुलित करेगी।", school: "स्कूल / क्लास (जैसे सोम-शुक्र 9-12)", work: "काम — कितने घंटे हैं या चाहिए", sleep: "नींद (जैसे 11pm-7am)", acts: "तुम्हारी चीज़ें (दौड़, योग, मछली पकड़ना…)", notes: "और कुछ", make: "हफ़्ता प्लान करो 🐦", remake: "फिर से", thinking: "चिड़िया प्लान बना रही है…", things: "अपनी चीज़ें ढूंढो", thingsSub: "पास के क्लब और ग्रुप — मिले तो उस दुनिया के बोर्ड पर पोस्ट करो।", near: "पास", back: "← elsewhr पर वापस", meetup: "Meetup पर", groups: "Facebook ग्रुप", nearby: "पास खोजो", post: "अपनी दुनिया के बोर्ड पर पोस्ट करो →" },
  pl: { title: "mój tydzień", sub: "powiedz ptakowi swoje stałe godziny — zrównoważy szkołę, pracę, odpoczynek i twoje rzeczy.", school: "szkoła / zajęcia (np. pon-pt 9-12)", work: "praca — ile godzin masz lub chcesz", sleep: "sen (np. 23-7)", acts: "twoje rzeczy (bieganie, joga, wędkarstwo…)", notes: "coś jeszcze", make: "zaplanuj tydzień 🐦", remake: "przeplanuj", thinking: "ptak planuje…", things: "znajdź swoje rzeczy", thingsSub: "kluby i grupy w pobliżu — a gdy znajdziesz, wrzuć na tablicę tego świata.", near: "blisko", back: "← wróć do elsewhr", meetup: "na Meetup", groups: "grupy na Facebooku", nearby: "szukaj w pobliżu", post: "dodaj na tablicę swojego świata →" },
  fr: { title: "ma semaine", sub: "donne tes horaires fixes à l'oiseau — il équilibre école, travail, repos et tes trucs.", school: "école / cours (ex. lun-ven 9-12)", work: "travail — heures que tu as ou veux", sleep: "sommeil (ex. 23h-7h)", acts: "tes trucs (course, yoga, pêche…)", notes: "autre chose", make: "planifier ma semaine 🐦", remake: "replanifier", thinking: "l'oiseau planifie…", things: "trouve tes trucs", thingsSub: "clubs et groupes près de toi — et quand tu en trouves un, poste-le sur le tableau de ce monde.", near: "près de", back: "← retour à elsewhr", meetup: "sur Meetup", groups: "groupes Facebook", nearby: "chercher à proximité", post: "poste-le sur le tableau de ton monde →" },
};

const ACTIVITY_CHIPS = ["running", "yoga", "gym", "fishing", "hiking", "football", "basketball", "swimming", "chess", "dance", "photography", "volunteering", "book club", "cricket", "badminton", "cycling"];

export default function PlanPage() {
  const { lang } = useLang();
  const s = S[lang] || S.en;
  const [school, setSchool] = useState("");
  const [work, setWork] = useState("");
  const [sleep, setSleep] = useState("");
  const [acts, setActs] = useState("");
  const [notes, setNotes] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [place, setPlace] = useState<string>("");
  const [myWorld, setMyWorld] = useState<string>("");

  // restore the saved plan + learn their place for the activity finder
  useEffect(() => {
    try {
      const raw = localStorage.getItem("wh_plan");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.plan) setPlan(d.plan);
        if (d.inputs) { setSchool(d.inputs.school || ""); setWork(d.inputs.work || ""); setSleep(d.inputs.sleep || ""); setActs(d.inputs.acts || ""); setNotes(d.inputs.notes || ""); }
      }
    } catch { /* fresh page then */ }
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: p } = await supabase.from("profiles").select("location, dest_place").eq("user_id", userData.user.id).maybeSingle();
      const loc = (p?.location || "").trim();
      const dest = (p?.dest_place || "").trim();
      setPlace(loc || dest || "");
      setMyWorld(dest || loc || "");
    })();
  }, []);

  async function make() {
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ school, work, sleep, activities: acts, notes, lang }),
      });
      const d = await r.json();
      if (d.ok && d.plan) {
        setPlan(d.plan as Plan);
        try { localStorage.setItem("wh_plan", JSON.stringify({ plan: d.plan, inputs: { school, work, sleep, acts, notes } })); } catch { /* fine */ }
      } else setErr((d.error as string) || "try again");
    } catch { setErr("try again"); }
    setBusy(false);
  }

  const inputCls = "w-full px-4 py-3 rounded-2xl border-[3px] border-[#1c1410] bg-[#fff6ec] text-[#1c1410] placeholder-[#6b5e52]/60 outline-none focus:border-[#6b4eff] text-[14px] shadow-[4px_4px_0_rgba(28,20,16,0.9)]";

  return (
    <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex justify-center px-4 py-8">
      <div className="w-full max-w-[760px]">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">elsewhr<span className="text-[#c8f000]">.</span></Link>
          <Link href="/" className="font-mono text-[11px] text-[#fff6ec]/80 underline underline-offset-4 hover:text-[#fff6ec]">{s.back}</Link>
        </div>

        <h1 className="font-[Syne] font-extrabold text-3xl text-[#fff6ec] lowercase">🗓 {s.title}</h1>
        <p className="mt-2 mb-6 text-[14px] text-[#fff6ec]/90 leading-snug">{s.sub}</p>

        <div className="flex flex-col gap-3 mb-4">
          <input className={inputCls} value={school} onChange={(e) => setSchool(e.target.value)} placeholder={s.school} maxLength={140} />
          <input className={inputCls} value={work} onChange={(e) => setWork(e.target.value)} placeholder={s.work} maxLength={140} />
          <div className="flex gap-3">
            <input className={inputCls} value={sleep} onChange={(e) => setSleep(e.target.value)} placeholder={s.sleep} maxLength={60} />
            <input className={inputCls} value={acts} onChange={(e) => setActs(e.target.value)} placeholder={s.acts} maxLength={140} />
          </div>
          <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={s.notes} maxLength={200} />
        </div>
        <button type="button" onClick={make} disabled={busy}
          className="px-6 py-3 rounded-2xl border-[3px] border-[#1c1410] bg-[#c8f000] font-bold text-[15px] shadow-[5px_5px_0_rgba(28,20,16,0.9)] hover:translate-y-[-2px] transition-transform disabled:opacity-50"
        >
          {busy ? s.thinking : plan ? s.remake : s.make}
        </button>
        {err && <p className="mt-2 font-mono text-[12px] text-[#fff6ec]">{err}</p>}

        {plan && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plan.days.map((d) => (
              <div key={d.day} className="bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-2xl p-4 shadow-[5px_5px_0_rgba(28,20,16,0.9)]">
                <p className="font-[Syne] font-extrabold text-[16px] lowercase mb-2">{d.day}</p>
                <div className="flex flex-col gap-1.5">
                  {d.blocks.map((b, i) => (
                    <div key={i} className="flex items-baseline gap-2 text-[13px] leading-snug">
                      <span className="font-mono text-[11px] text-[#6b5e52] whitespace-nowrap">{b.time}</span>
                      <span className="font-medium">{b.emoji ? b.emoji + " " : ""}{b.what}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {Array.isArray(plan.tips) && plan.tips.length > 0 && (
              <div className="sm:col-span-2 bg-[#1c1410] text-[#fff6ec] border-[3px] border-[#1c1410] rounded-2xl p-4">
                {plan.tips.map((t, i) => (
                  <p key={i} className="text-[13px] leading-snug mb-1">🐦 {t}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FIND YOUR THINGS: running club, yoga, fishing — near your city */}
        <div className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#fff6ec]/80">✨ {s.things}{place ? " · " + s.near + " " + place : ""}</p>
          <p className="mt-1 mb-4 text-[13px] text-[#fff6ec]/85 leading-snug">{s.thingsSub}</p>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_CHIPS.map((a) => {
              const q = encodeURIComponent(a + (place ? " near " + place : " club near me"));
              return (
                <div key={a} className="bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-2xl px-3.5 py-2.5 shadow-[4px_4px_0_rgba(28,20,16,0.9)]">
                  <p className="font-bold text-[13.5px] lowercase mb-1.5">{a}</p>
                  <div className="flex gap-2">
                    <a href={"https://www.google.com/search?q=" + q} target="_blank" rel="noopener noreferrer" className="font-mono text-[10.5px] font-bold text-[#6b4eff] underline underline-offset-2">{s.nearby} ↗</a>
                    <a href={"https://www.meetup.com/find/?keywords=" + encodeURIComponent(a) + (place ? "&location=" + encodeURIComponent(place) : "")} target="_blank" rel="noopener noreferrer" className="font-mono text-[10.5px] font-bold text-[#6b4eff] underline underline-offset-2">{s.meetup} ↗</a>
                    <a href={"https://www.facebook.com/search/groups/?q=" + q} target="_blank" rel="noopener noreferrer" className="font-mono text-[10.5px] font-bold text-[#6b4eff] underline underline-offset-2">{s.groups} ↗</a>
                  </div>
                </div>
              );
            })}
          </div>
          {myWorld && (
            <p className="mt-4">
              <Link href={"/w?place=" + encodeURIComponent(myWorld)} className="font-mono text-[12px] font-bold text-[#c8f000] underline underline-offset-4">
                🗓 {s.post}
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
