"use client";

// elsewhr — 🔭 the lookout: your private agent.
// New file: app/lookout/page.tsx  ·  door on the home rack.
// Tell it what to watch — your job, your search, or nothing at all — and it
// checks your place daily, leaving quiet notes only you can read.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";

const S: Record<string, {
  title: string; sub: string; back: string;
  watchLabel: string; watchPh: string; placeLabel: string; placePh: string;
  activeOn: string; activeOff: string; save: string; saved: string;
  notesTitle: string; noNotes: string; loginFirst: string; sweepNow: string; sweeping: string; cooled: string;
}> = {
  en: { title: "the lookout", sub: "your private agent. tell it what to watch — your job, your search, or nothing — and it checks your place every day. notes land here, for your eyes only.", back: "← back", watchLabel: "what should it watch?", watchPh: "e.g. part-time warehouse or barista work · or: keeping an eye on my current job's field", placeLabel: "around where?", placePh: "your city or school (start typing…)", activeOn: "🔭 watching", activeOff: "😴 paused", save: "save my lookout →", saved: "saved — first note arrives after the next daily sweep 🐦", notesTitle: "notes from your lookout", noNotes: "no notes yet — the lookout sweeps once a day.", loginFirst: "log in to set your lookout →", sweepNow: "🔍 sweep now", sweeping: "hunting…", cooled: "the lookout just swept — give it 10 minutes 🐦" },
  es: { title: "el vigía", sub: "tu agente privado. dile qué vigilar — tu trabajo, tu búsqueda, o nada — y revisa tu zona cada día. las notas llegan aquí, solo para tus ojos.", back: "← volver", watchLabel: "¿qué debe vigilar?", watchPh: "ej. trabajo de medio tiempo en almacén o café", placeLabel: "¿por dónde?", placePh: "tu ciudad o escuela (escribe…)", activeOn: "🔭 vigilando", activeOff: "😴 en pausa", save: "guardar mi vigía →", saved: "guardado — la primera nota llega tras el próximo barrido diario 🐦", notesTitle: "notas de tu vigía", noNotes: "sin notas aún — el vigía pasa una vez al día.", loginFirst: "inicia sesión para tu vigía →", sweepNow: "🔍 buscar ahora", sweeping: "cazando…", cooled: "el vigía acaba de barrer — dale 10 minutos 🐦" },
  pt: { title: "o vigia", sub: "seu agente privado. diga o que vigiar — seu trabalho, sua busca, ou nada — e ele confere sua área todo dia. as notas chegam aqui, só para você.", back: "← voltar", watchLabel: "o que ele deve vigiar?", watchPh: "ex. trabalho de meio período em armazém ou café", placeLabel: "por onde?", placePh: "sua cidade ou escola (digite…)", activeOn: "🔭 vigiando", activeOff: "😴 pausado", save: "salvar meu vigia →", saved: "salvo — a primeira nota chega após a próxima ronda diária 🐦", notesTitle: "notas do seu vigia", noNotes: "sem notas ainda — o vigia passa uma vez por dia.", loginFirst: "entre para configurar seu vigia →", sweepNow: "🔍 varrer agora", sweeping: "caçando…", cooled: "o vigia acabou de varrer — dê 10 minutos 🐦" },
  hi: { title: "पहरेदार", sub: "आपका निजी agent। बताओ क्या देखना है — आपकी job, आपकी खोज, या कुछ नहीं — और यह रोज़ आपकी जगह देखता है। notes यहाँ आते हैं, सिर्फ़ आपके लिए।", back: "← वापस", watchLabel: "यह क्या देखे?", watchPh: "जैसे: part-time warehouse या barista काम", placeLabel: "किसके आस-पास?", placePh: "आपका शहर या school (लिखना शुरू करो…)", activeOn: "🔭 देख रहा है", activeOff: "😴 रुका है", save: "मेरा पहरेदार सेव करो →", saved: "सेव हो गया — पहला note अगली रोज़ाना जांच के बाद 🐦", notesTitle: "आपके पहरेदार के notes", noNotes: "अभी कोई note नहीं — पहरेदार दिन में एक बार देखता है।", loginFirst: "पहरेदार के लिए log in करो →", sweepNow: "🔍 अभी खोजो", sweeping: "खोज रहा है…", cooled: "अभी-अभी खोजा है — 10 मिनट दो 🐦" },
  pl: { title: "czatownik", sub: "twój prywatny agent. powiedz mu, co obserwować — pracę, poszukiwania, albo nic — a on codziennie sprawdza twoją okolicę. notatki lądują tu, tylko dla ciebie.", back: "← wróć", watchLabel: "co ma obserwować?", watchPh: "np. praca dorywcza w magazynie lub kawiarni", placeLabel: "w okolicy czego?", placePh: "twoje miasto lub szkoła (zacznij pisać…)", activeOn: "🔭 obserwuje", activeOff: "😴 wstrzymany", save: "zapisz czatownika →", saved: "zapisano — pierwsza notatka po najbliższym dziennym obchodzie 🐦", notesTitle: "notatki od czatownika", noNotes: "brak notatek — czatownik robi obchód raz dziennie.", loginFirst: "zaloguj się, by ustawić czatownika →", sweepNow: "🔍 przeszukaj teraz", sweeping: "poluje…", cooled: "czatownik dopiero co skanował — daj mu 10 minut 🐦" },
  fr: { title: "la vigie", sub: "ton agent privé. dis-lui quoi surveiller — ton boulot, ta recherche, ou rien — et il vérifie ton coin chaque jour. les notes arrivent ici, pour tes yeux seulement.", back: "← retour", watchLabel: "que doit-il surveiller ?", watchPh: "ex. petit boulot en entrepôt ou en café", placeLabel: "autour d'où ?", placePh: "ta ville ou ton école (commence à écrire…)", activeOn: "🔭 en veille", activeOff: "😴 en pause", save: "enregistrer ma vigie →", saved: "enregistré — première note après la prochaine ronde 🐦", notesTitle: "notes de ta vigie", noNotes: "pas encore de note — la vigie passe une fois par jour.", loginFirst: "connecte-toi pour ta vigie →", sweepNow: "🔍 balayer maintenant", sweeping: "en chasse…", cooled: "la vigie vient de balayer — laisse-lui 10 minutes 🐦" },
};

type Note = { id: number; body: string; created_at: string; seen: boolean };

export default function LookoutPage() {
  const { lang } = useLang();
  const s = S[lang] || S.en;
  const [uid, setUid] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [watch, setWatch] = useState("");
  const [place, setPlace] = useState("");
  const [active, setActive] = useState(true);
  const [sugs, setSugs] = useState<{ name: string }[]>([]);
  const [sugsOpen, setSugsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const seenOnce = useRef(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user?.id ?? null;
      setUid(u);
      setChecked(true);
      if (!u) return;
      const [{ data: lk }, { data: ns }] = await Promise.all([
        supabase.from("lookouts").select("watch, place, active").eq("user_id", u).maybeSingle(),
        supabase.from("lookout_notes").select("id, body, created_at, seen").eq("user_id", u).order("id", { ascending: false }).limit(30),
      ]);
      if (lk) { setWatch(lk.watch || ""); setPlace(lk.place || ""); setActive(lk.active !== false); }
      if (ns) setNotes(ns as Note[]);
    })();
  }, []);

  // reading is seeing
  useEffect(() => {
    if (!uid || seenOnce.current || notes.every((n) => n.seen)) return;
    seenOnce.current = true;
    supabase.from("lookout_notes").update({ seen: true }).eq("user_id", uid).eq("seen", false).then(() => {});
  }, [uid, notes]);

  // the standing rule: the place suggests
  useEffect(() => {
    const t = place.trim();
    if (t.length < 2) { setSugs([]); setSugsOpen(false); return; }
    const timer = setTimeout(async () => {
      try {
        const r = await fetch("/api/school?suggest=" + encodeURIComponent(t));
        const d = await r.json();
        if (Array.isArray(d.suggestions)) { setSugs(d.suggestions); setSugsOpen(d.suggestions.length > 0); }
      } catch { /* typing still works */ }
    }, 220);
    return () => clearTimeout(timer);
  }, [place]);

  async function sweepNow() {
    if (!uid || busy) return;
    setBusy(true);
    setMsg(s.sweeping);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      const r = await fetch("/api/lookout/sweep", { method: "POST", headers: { Authorization: "Bearer " + (token || "") } });
      if (r.status === 429) { setMsg(s.cooled); }
      else {
        const { data: ns } = await supabase.from("lookout_notes").select("id, body, created_at, seen").eq("user_id", uid).order("id", { ascending: false }).limit(30);
        if (ns) setNotes(ns as Note[]);
        setMsg("");
      }
    } catch { setMsg(""); }
    setBusy(false);
  }

  function linkify(text: string) {
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    return parts.map((p, i) =>
      /^https?:\/\//.test(p) ? (
        <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="font-bold text-[#6b4eff] underline underline-offset-2 break-all">
          {p.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}…
        </a>
      ) : (
        <span key={i}>{p}</span>
      )
    );
  }

  async function save() {
    if (!uid || busy) return;
    setBusy(true);
    setMsg("");
    await supabase.from("lookouts").upsert({ user_id: uid, watch: watch.trim().slice(0, 300), place: place.trim().slice(0, 120), active });
    setMsg(s.saved);
    setBusy(false);
  }

  const inputCls = "w-full px-4 py-3 rounded-xl border-2 border-[#1c1410] bg-white text-[#1c1410] placeholder-[#6b5e52]/60 outline-none focus:border-[#6b4eff] text-[14px]";

  return (
    <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] px-4 py-6">
      <div className="w-full max-w-[640px] mx-auto flex items-center justify-between">
        <Link href="/" className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">elsewhr<span className="text-[#c8f000]">.</span></Link>
        <button type="button" onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.href = "/"; }}
          className="font-mono text-[11px] text-[#fff6ec]/80 underline underline-offset-4 hover:text-[#fff6ec]">{s.back}</button>
      </div>
      <div className="w-full max-w-[640px] mx-auto mt-5">
        <h1 className="font-[Syne] font-extrabold text-3xl text-[#fff6ec] lowercase">🔭 {s.title}</h1>
        <p className="mt-2 text-[14px] text-[#fff6ec]/90 leading-snug">{s.sub}</p>

        {checked && !uid && (
          <Link href="/login" className="mt-6 inline-block px-6 py-3.5 rounded-2xl bg-[#c8f000] font-[Syne] font-extrabold border-[3px] border-[#1c1410] shadow-[5px_5px_0_#1c1410]">
            {s.loginFirst}
          </Link>
        )}

        {uid && (
          <>
            <div className="mt-6 bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl p-5 shadow-[7px_7px_0_rgba(28,20,16,0.9)]">
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#6b5e52]">{s.watchLabel}</p>
              <textarea value={watch} onChange={(e) => setWatch(e.target.value)} placeholder={s.watchPh} rows={2} maxLength={300}
                className={inputCls + " mt-2 resize-y"} />
              <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-[#6b5e52]">{s.placeLabel}</p>
              <div className="relative mt-2">
                <input value={place} onChange={(e) => setPlace(e.target.value)}
                  onBlur={() => setTimeout(() => setSugsOpen(false), 150)}
                  onFocus={() => sugs.length > 0 && setSugsOpen(true)}
                  placeholder={s.placePh} maxLength={120} className={inputCls} />
                {sugsOpen && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white border-2 border-[#1c1410] rounded-xl overflow-hidden shadow-[4px_4px_0_rgba(28,20,16,0.5)]">
                    {sugs.map((sg) => (
                      <button key={sg.name} type="button" onMouseDown={() => { setPlace(sg.name); setSugsOpen(false); }}
                        className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#c8f000]/40">🎓 {sg.name}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                <button type="button" onClick={() => setActive(!active)}
                  className={`px-4 py-2 rounded-full border-2 border-[#1c1410] text-[13px] font-bold ${active ? "bg-[#c8f000]" : "bg-white"}`}>
                  {active ? s.activeOn : s.activeOff}
                </button>
                <button type="button" onClick={sweepNow} disabled={busy}
                  className="px-4 py-2.5 rounded-2xl bg-[#c8f000] border-2 border-[#1c1410] font-[Syne] font-bold text-[14px] disabled:opacity-50">
                  {busy ? s.sweeping : s.sweepNow}
                </button>
                <button type="button" onClick={save} disabled={busy}
                  className="px-5 py-2.5 rounded-2xl bg-[#1c1410] text-[#fff6ec] font-[Syne] font-bold text-[14px] disabled:opacity-50">
                  {s.save}
                </button>
              </div>
              {msg && <p className="mt-3 text-[13px] font-bold text-[#1c1410]">{msg}</p>}
            </div>

            <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-[#fff6ec]/80">{s.notesTitle}</p>
            <div className="mt-3 flex flex-col gap-3">
              {notes.length === 0 && <p className="text-[13px] text-[#fff6ec]/80">{s.noNotes}</p>}
              {notes.map((n) => (
                <div key={n.id} className="bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-2xl px-4 py-3 shadow-[5px_5px_0_rgba(28,20,16,0.9)]">
                  <p className="text-[14px] leading-relaxed whitespace-pre-line">🔭 {linkify(n.body)}</p>
                  <p className="mt-1.5 font-mono text-[10px] text-[#6b5e52]">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
