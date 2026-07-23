"use client";

// elsewhr — the world page: everything about where you're headed.
// New file: app/w/page.tsx  (open as /w?place=California%20State%20University...)
// Real school info from Wikipedia (fail-soft) + the layer nobody else has:
// who's arriving with you, and who's already there.

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";

type WikiInfo = {
  extract?: string;
  thumbnail?: { source: string };
  content_urls?: { desktop?: { page?: string } };
  description?: string;
};

type Facts = { students?: string; staff?: string; founded?: string; site?: string; qid?: string };

type Notable = { name: string; url?: string };

// the school's famous names, straight from Wikidata (educated-at, ranked by fame)
async function fetchNotable(qid: string): Promise<Notable[]> {
  try {
    const sparql = `SELECT ?pLabel ?article WHERE { ?p wdt:P69 wd:${qid} . ?p wikibase:sitelinks ?sl . OPTIONAL { ?article schema:about ?p ; schema:isPartOf <https://en.wikipedia.org/> . } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } ORDER BY DESC(?sl) LIMIT 6`;
    const r = await fetch("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(sparql), {
      headers: { Accept: "application/sparql-results+json" },
    });
    const d = await r.json();
    const rows = (d?.results?.bindings ?? []) as { pLabel?: { value?: string }; article?: { value?: string } }[];
    return rows
      .map((b) => ({ name: b.pLabel?.value || "", url: b.article?.value }))
      .filter((n) => n.name && !/^Q\d+$/.test(n.name));
  } catch { return []; }
}

type Happening = { id: number; place: string; title: string; when_text?: string | null; link?: string | null; created_by?: string | null };

// structured facts from Wikidata: student body, staff, founding year, official site
async function fetchFacts(title: string): Promise<Facts> {
  const out: Facts = {};
  try {
    const r1 = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageprops&ppprop=wikibase_item&format=json&origin=*`
    );
    const d1 = await r1.json();
    const pages = d1?.query?.pages || {};
    const first = Object.values(pages)[0] as { pageprops?: { wikibase_item?: string } } | undefined;
    const qid = first?.pageprops?.wikibase_item;
    if (!qid) return out;
    out.qid = qid;
    const r2 = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);
    const d2 = await r2.json();
    const claims = d2?.entities?.[qid]?.claims || {};
    const amount = (p: string) => {
      const v = claims?.[p]?.[0]?.mainsnak?.datavalue?.value?.amount;
      if (!v) return undefined;
      const n = Number(String(v).replace("+", ""));
      return Number.isFinite(n) ? n.toLocaleString() : undefined;
    };
    out.students = amount("P2196");
    out.staff = amount("P8113") || amount("P1128");
    const t = claims?.P571?.[0]?.mainsnak?.datavalue?.value?.time as string | undefined;
    if (t) out.founded = t.slice(1, 5);
    const site = claims?.P856?.[0]?.mainsnak?.datavalue?.value as string | undefined;
    if (site) out.site = site;
  } catch { /* facts are a bonus, never a blocker */ }
  return out;
}

type Person = {
  id: number;
  user_id?: string | null;
  name: string;
  photo?: string | null;
  headline: string;
  accent?: string | null;
  mindset?: string[] | null;
  dest_term?: string | null;
  dest_program?: string | null;
  dest_status?: string | null;
  location?: string | null;
  seeking?: string | null;
  learning?: string | null;
  livesHere?: boolean;
};

const STRINGS: Record<string, {
  about: string; official: string; arriving: string; already: string;
  nobody: string; youFirst: string; sayHi: string; back: string; loading: string;
  events: string; noEvents: string; addEvent: string; evTitle: string; evWhen: string; evLink: string; evPost: string;
  alumni: string; notable: string;
  wikiNote: string;
}> = {
  en: {
    about: "about this place",
    official: "official site →",
    arriving: "arriving",
    already: "already there",
    nobody: "nobody here yet — the door is open.",
    youFirst: "set this as your destination and you're the first face people see when they search it.",
    sayHi: "say hi →",
    events: "happenings",
    noEvents: "nothing planned yet — post the first one. orientation, meetup, chai at 5.",
    addEvent: "+ add a happening",
    evTitle: "what’s happening",
    evWhen: "when (e.g. Aug 20, 6pm)",
    evLink: "link (optional)",
    evPost: "post it",
    alumni: "alumni here",
    notable: "notable alumni",
    back: "← back to elsewhr",
    loading: "finding this place…",
    wikiNote: "from Wikipedia",
  },
  es: {
    about: "sobre este lugar",
    official: "sitio oficial →",
    arriving: "llegando",
    already: "ya están ahí",
    nobody: "nadie aquí todavía — la puerta está abierta.",
    youFirst: "ponlo como tu destino y serás la primera cara que la gente vea al buscarlo.",
    sayHi: "saluda →",
    events: "eventos",
    noEvents: "nada planeado aún — publica el primero. orientación, encuentro, café a las 5.",
    addEvent: "+ agregar evento",
    evTitle: "qué pasa",
    evWhen: "cuándo (ej. 20 ago, 6pm)",
    evLink: "enlace (opcional)",
    evPost: "publicar",
    alumni: "exalumnos aquí",
    notable: "exalumnos destacados",
    back: "← volver a elsewhr",
    loading: "buscando este lugar…",
    wikiNote: "de Wikipedia",
  },
  pt: {
    about: "sobre este lugar",
    official: "site oficial →",
    arriving: "chegando",
    already: "já estão lá",
    nobody: "ninguém aqui ainda — a porta está aberta.",
    youFirst: "defina como seu destino e você será o primeiro rosto que as pessoas veem ao buscar.",
    sayHi: "diga oi →",
    events: "eventos",
    noEvents: "nada planejado ainda — poste o primeiro. orientação, encontro, café às 5.",
    addEvent: "+ adicionar evento",
    evTitle: "o que vai rolar",
    evWhen: "quando (ex. 20 ago, 18h)",
    evLink: "link (opcional)",
    evPost: "postar",
    alumni: "ex-alunos aqui",
    notable: "ex-alunos notáveis",
    back: "← voltar ao elsewhr",
    loading: "procurando este lugar…",
    wikiNote: "da Wikipédia",
  },
  hi: {
    about: "इस जगह के बारे में",
    official: "आधिकारिक साइट →",
    arriving: "आ रहे हैं",
    already: "पहले से वहाँ हैं",
    nobody: "अभी यहाँ कोई नहीं — दरवाज़ा खुला है।",
    youFirst: "इसे अपनी मंज़िल बनाओ और खोजने वालों को सबसे पहले तुम्हारा चेहरा दिखेगा।",
    sayHi: "hi बोलो →",
    events: "आयोजन",
    noEvents: "अभी कुछ नहीं — पहला आप डालो।",
    addEvent: "+ आयोजन जोड़ो",
    evTitle: "क्या हो रहा है",
    evWhen: "कब (जैसे 20 अग, 6pm)",
    evLink: "लिंक (वैकल्पिक)",
    evPost: "पोस्ट करो",
    alumni: "यहाँ के पूर्व छात्र",
    notable: "प्रसिद्ध पूर्व छात्र",
    back: "← elsewhr पर वापस",
    loading: "यह जगह ढूंढ रहे हैं…",
    wikiNote: "विकिपीडिया से",
  },
  pl: {
    about: "o tym miejscu",
    official: "oficjalna strona →",
    arriving: "przyjeżdżają",
    already: "już tam są",
    nobody: "nikogo tu jeszcze nie ma — drzwi są otwarte.",
    youFirst: "ustaw to jako swój cel, a będziesz pierwszą twarzą, którą zobaczą szukający.",
    sayHi: "przywitaj się →",
    events: "wydarzenia",
    noEvents: "nic nie zaplanowano — dodaj pierwsze. orientacja, spotkanie, kawa o 17.",
    addEvent: "+ dodaj wydarzenie",
    evTitle: "co się dzieje",
    evWhen: "kiedy (np. 20 sie, 18:00)",
    evLink: "link (opcjonalnie)",
    evPost: "opublikuj",
    alumni: "absolwenci tutaj",
    notable: "znani absolwenci",
    back: "← wróć do elsewhr",
    loading: "szukam tego miejsca…",
    wikiNote: "z Wikipedii",
  },
  fr: {
    about: "à propos de ce lieu",
    official: "site officiel →",
    arriving: "en route",
    already: "déjà sur place",
    nobody: "personne ici pour l'instant — la porte est ouverte.",
    youFirst: "définis-le comme ta destination et tu seras le premier visage qu'on verra en cherchant.",
    sayHi: "dis bonjour →",
    events: "événements",
    noEvents: "rien de prévu — poste le premier. orientation, rencontre, café à 17h.",
    addEvent: "+ ajouter un événement",
    evTitle: "ce qui se passe",
    evWhen: "quand (ex. 20 août, 18h)",
    evLink: "lien (optionnel)",
    evPost: "publier",
    alumni: "anciens ici",
    notable: "anciens célèbres",
    back: "← retour à elsewhr",
    loading: "on cherche ce lieu…",
    wikiNote: "de Wikipédia",
  },
};

const WIKI_LANG: Record<string, string> = { en: "en", es: "es", pt: "pt", hi: "hi", pl: "pl", fr: "fr" };

function WorldPageInner() {
  const params = useSearchParams();
  const place = (params.get("place") || "").trim();
  const { lang } = useLang();
  const s = STRINGS[lang] || STRINGS.en;

  const [wiki, setWiki] = useState<WikiInfo | null>(null);
  const [facts, setFacts] = useState<Facts>({});
  const [filter, setFilter] = useState("");
  const [events, setEvents] = useState<Happening[]>([]);
  const [notable, setNotable] = useState<Notable[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [evOpen, setEvOpen] = useState(false);
  const [evTitle, setEvTitle] = useState("");
  const [evWhen, setEvWhen] = useState("");
  const [evLink, setEvLink] = useState("");
  const [evBusy, setEvBusy] = useState(false);
  const [site, setSite] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  // real info about the place: Wikipedia in your language, English fallback, official site via the university db
  useEffect(() => {
    if (!place) return;
    let alive = true;
    (async () => {
      const wl = WIKI_LANG[lang] || "en";
      const title = encodeURIComponent(place.replace(/ /g, "_"));
      try {
        let r = await fetch(`https://${wl}.wikipedia.org/api/rest_v1/page/summary/${title}`);
        if (!r.ok && wl !== "en") r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
        if (r.ok) {
          const d = (await r.json()) as WikiInfo & { type?: string };
          if (alive && d.extract && d.type !== "disambiguation") setWiki(d);
        }
      } catch { /* the place card still renders */ }
      // structured facts + the true official site from Wikidata; search link as the floor
      if (alive) setSite(`https://www.google.com/search?q=${encodeURIComponent(place + " official site")}`);
      const f = await fetchFacts(place);
      if (alive) {
        setFacts(f);
        if (f.site) setSite(f.site);
      }
      if (f.qid) {
        const nb = await fetchNotable(f.qid);
        if (alive) setNotable(nb);
      }
      const [{ data: evs }, { data: userData }] = await Promise.all([
        supabase.from("events").select("*").ilike("place", place).order("id", { ascending: false }).limit(20),
        supabase.auth.getUser(),
      ]);
      if (alive) {
        setEvents((evs ?? []) as Happening[]);
        setUid(userData?.user?.id ?? null);
      }
    })();
    return () => { alive = false; };
  }, [place, lang]);

  // the elsewhr layer: everyone whose destination is this place
  useEffect(() => {
    if (!place) { setLoading(false); return; }
    let alive = true;
    (async () => {
      const cols = "id, user_id, name, photo, headline, location, accent, mindset, seeking, learning, dest_term, dest_program, dest_status";
      const [dst, liv] = await Promise.all([
        supabase.from("profiles").select(cols).ilike("dest_place", place).order("id", { ascending: false }).limit(60),
        supabase.from("profiles").select(cols).ilike("location", "%" + place + "%").order("id", { ascending: false }).limit(60),
      ]);
      if (alive) {
        const seen = new Set<number>();
        const merged: Person[] = [];
        for (const row of [...(dst.data ?? []), ...(liv.data ?? [])] as Person[]) {
          if (!row.user_id || seen.has(row.id)) continue;
          seen.add(row.id);
          merged.push({ ...row, livesHere: (row.location || "").toLowerCase().includes(place.toLowerCase()) });
        }
        setPeople(merged);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [place]);

  // "mehndi artists in Kochi": one place, one field, one box
  const visible = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return people;
    return people.filter((p) =>
      [p.name, p.headline, p.dest_program, p.seeking, p.learning, ...(p.mindset ?? [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(f))
    );
  }, [people, filter]);
  const alumni = useMemo(() => visible.filter((p) => p.dest_status === "graduated"), [visible]);
  const already = useMemo(() => visible.filter((p) => p.dest_status !== "graduated" && (p.dest_status === "current" || p.livesHere)), [visible]);
  const arriving = useMemo(() => visible.filter((p) => p.dest_status !== "graduated" && p.dest_status !== "current" && !p.livesHere), [visible]);

  // arriving, grouped by term — the cohorts forming in real time
  const byTerm = useMemo(() => {
    const m = new Map<string, Person[]>();
    for (const p of arriving) {
      const k = (p.dest_term || "").trim() || "—";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(p);
    }
    return [...m.entries()].sort((a, b) => (a[0] === "—" ? 1 : b[0] === "—" ? -1 : a[0].localeCompare(b[0])));
  }, [arriving]);

  async function postEvent() {
    const title = evTitle.trim();
    if (!title || !uid || evBusy) return;
    setEvBusy(true);
    const { data, error } = await supabase
      .from("events")
      .insert({ place, title, when_text: evWhen.trim() || null, link: evLink.trim() || null, created_by: uid })
      .select()
      .single();
    setEvBusy(false);
    if (!error && data) {
      setEvents([data as Happening, ...events]);
      setEvTitle(""); setEvWhen(""); setEvLink(""); setEvOpen(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-[#ff5d3b] text-[#1c1410] flex justify-center px-4 py-8">
      <div className="w-full max-w-[640px]">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">
            elsewhr<span className="text-[#c8f000]">.</span>
          </Link>
          <Link href="/" className="font-mono text-[11px] text-[#fff6ec]/80 underline underline-offset-4 hover:text-[#fff6ec]">
            {s.back}
          </Link>
        </div>

        <h1 className="font-[Syne] font-extrabold text-3xl text-[#fff6ec] leading-tight">{place || "…"}</h1>
        {wiki?.description && (
          <p className="mt-1 font-mono text-[11.5px] text-[#fff6ec]/85 tracking-wide">{wiki.description}</p>
        )}

        {/* the place itself */}
        {wiki && (
          <div className="mt-5 bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl overflow-hidden shadow-[7px_7px_0_#1c1410]">
            {wiki.thumbnail?.source && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={wiki.thumbnail.source} alt={place} className="w-full h-44 object-cover border-b-[3px] border-[#1c1410]" />
            )}
            <div className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b5e52] mb-2">{s.about}</p>
              <p className="text-[14px] leading-relaxed">{wiki.extract}</p>
              {(facts.students || facts.staff || facts.founded) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {facts.students && (
                    <span className="px-3 py-1.5 rounded-full border-2 border-[#1c1410] bg-white text-[12px] font-bold">🎓 {facts.students} students</span>
                  )}
                  {facts.staff && (
                    <span className="px-3 py-1.5 rounded-full border-2 border-[#1c1410] bg-white text-[12px] font-bold">👥 {facts.staff} staff</span>
                  )}
                  {facts.founded && (
                    <span className="px-3 py-1.5 rounded-full border-2 border-[#1c1410] bg-white text-[12px] font-bold">est. {facts.founded}</span>
                  )}
                </div>
              )}
              {notable.length > 0 && (
                <div className="mt-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b5e52] mb-1.5">★ {s.notable}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {notable.map((n) =>
                      n.url ? (
                        <a key={n.name} href={n.url} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-full border-2 border-[#1c1410] bg-white text-[12px] font-bold hover:bg-[#c8f000]"
                        >
                          {n.name} ↗
                        </a>
                      ) : (
                        <span key={n.name} className="px-3 py-1.5 rounded-full border-2 border-[#1c1410] bg-white text-[12px] font-bold">
                          {n.name}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
              <p className="mt-3">
                <Link href={"/compare?a=" + encodeURIComponent(place)} className="font-mono text-[12px] font-bold text-[#6b4eff] underline underline-offset-4">
                  ⚖️ compare this school →
                </Link>
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-4">
                {site && (
                  <a href={site} target="_blank" rel="noopener noreferrer" className="font-mono text-[12px] font-bold text-[#6b4eff] underline underline-offset-4">
                    {s.official}
                  </a>
                )}
                {wiki.content_urls?.desktop?.page && (
                  <a href={wiki.content_urls.desktop.page} target="_blank" rel="noopener noreferrer" className="font-mono text-[10.5px] text-[#6b5e52] underline underline-offset-4">
                    {s.wikiNote}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* the elsewhr layer: the campus's real activity is its people */}
        {/* HAPPENINGS: the world's corkboard */}
        {!loading && (
          <div className="mt-6 bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl p-5 shadow-[7px_7px_0_rgba(28,20,16,0.9)]">
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#6b5e52]">🗓 {s.events} · {events.length}</p>
              {uid && (
                <button type="button" onClick={() => setEvOpen(!evOpen)} className="font-mono text-[11.5px] font-bold text-[#6b4eff] underline underline-offset-4">
                  {s.addEvent}
                </button>
              )}
            </div>
            {evOpen && (
              <div className="mt-3 flex flex-col gap-2">
                <input value={evTitle} onChange={(e) => setEvTitle(e.target.value)} placeholder={s.evTitle} maxLength={90}
                  className="px-3 py-2.5 rounded-xl border-2 border-[#1c1410] bg-white outline-none focus:border-[#6b4eff] text-[14px]" />
                <div className="flex gap-2">
                  <input value={evWhen} onChange={(e) => setEvWhen(e.target.value)} placeholder={s.evWhen} maxLength={40}
                    className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border-2 border-[#1c1410] bg-white outline-none focus:border-[#6b4eff] text-[14px]" />
                  <input value={evLink} onChange={(e) => setEvLink(e.target.value)} placeholder={s.evLink} maxLength={200}
                    className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border-2 border-[#1c1410] bg-white outline-none focus:border-[#6b4eff] text-[14px]" />
                </div>
                <button type="button" onClick={postEvent} disabled={!evTitle.trim() || evBusy}
                  className="self-start px-4 py-2.5 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-[13px] disabled:opacity-40">
                  {s.evPost}
                </button>
              </div>
            )}
            {events.length === 0 && !evOpen && (
              <p className="mt-2 text-[13px] text-[#6b5e52] leading-snug">{s.noEvents}</p>
            )}
            {events.length > 0 && (
              <div className="mt-3 flex flex-col divide-y-2 divide-[#1c1410]/10">
                {events.map((ev) => (
                  <div key={ev.id} className="py-2.5 flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-[14px] leading-tight">{ev.title}</p>
                      {ev.when_text && <p className="text-[12px] text-[#6b5e52]">{ev.when_text}</p>}
                    </div>
                    {ev.link && (
                      <a href={ev.link} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] font-bold text-[#6b4eff] underline underline-offset-4 whitespace-nowrap">
                        →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && people.length > 1 && (
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="🧭 filter — cybersecurity, design, mehndi…"
            className="mt-6 w-full px-4 py-3 rounded-2xl border-[3px] border-[#1c1410] bg-[#fff6ec] outline-none focus:border-[#6b4eff] text-[14px] shadow-[5px_5px_0_rgba(28,20,16,0.9)]"
          />
        )}

        {loading && <p className="mt-6 font-mono text-[12px] text-[#fff6ec]/70">{s.loading}</p>}

        {!loading && people.length === 0 && (
          <div className="mt-6 bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl p-7 text-center shadow-[7px_7px_0_#1c1410]">
            <p className="font-bold text-[15px]">{s.nobody} 🐦</p>
            <p className="mt-2 text-[13px] text-[#6b5e52]">{s.youFirst}</p>
          </div>
        )}

        {!loading && already.length > 0 && (
          <PeopleBlock title={`${s.already} · ${already.length}`} people={already} sayHi={s.sayHi} />
        )}

        {!loading && alumni.length > 0 && (
          <PeopleBlock title={`🎓 ${s.alumni} · ${alumni.length}`} people={alumni} sayHi={s.sayHi} />
        )}

        {!loading && byTerm.map(([term, group]) => (
          <PeopleBlock key={term} title={`${s.arriving}${term !== "—" ? " · " + term : ""} · ${group.length}`} people={group} sayHi={s.sayHi} />
        ))}
      </div>
    </main>
  );
}

function PeopleBlock({ title, people, sayHi }: { title: string; people: Person[]; sayHi: string }) {
  return (
    <div className="mt-6">
      <p className="font-mono text-[11px] uppercase tracking-widest text-[#fff6ec] font-bold mb-3">{title}</p>
      <div className="flex flex-col gap-3">
        {people.map((p) => {
          const accent = p.accent || "#6b4eff";
          return (
            <Link key={p.id} href={`/p/${p.id}`} className="block bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-2xl p-4 shadow-[5px_5px_0_#1c1410] hover:translate-y-[-3px] transition-transform">
              <div className="flex items-center gap-3">
                {p.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo} alt={p.name} className="w-12 h-12 rounded-full object-cover border-[3px] flex-none" style={{ borderColor: accent }} />
                ) : (
                  <div className="w-12 h-12 rounded-full text-[#fff6ec] flex items-center justify-center font-[Syne] font-extrabold text-xl flex-none" style={{ background: accent }}>
                    {p.name?.[0] ?? "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-[Syne] font-extrabold text-[16px] leading-tight truncate">{p.name}</p>
                  <p className="text-[12.5px] text-[#6b5e52] truncate">
                    {p.dest_program && p.dest_program.trim() ? p.dest_program.trim() : p.headline}
                  </p>
                  {Array.isArray(p.mindset) && p.mindset.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.mindset.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-[#fff6ec] text-[10px] font-medium" style={{ background: accent }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="font-mono text-[11px] font-bold text-[#6b4eff] flex-none">{sayHi}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function WorldPage() {
  return (
    <Suspense fallback={null}>
      <WorldPageInner />
    </Suspense>
  );
}
