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
};

const STRINGS: Record<string, {
  about: string; official: string; arriving: string; already: string;
  nobody: string; youFirst: string; sayHi: string; back: string; loading: string;
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
      try {
        const r = await fetch(`https://universities.hipolabs.com/search?name=${encodeURIComponent(place)}&limit=1`);
        const d = (await r.json()) as { web_pages?: string[] }[];
        if (alive && d?.[0]?.web_pages?.[0]) setSite(d[0].web_pages[0]);
      } catch { /* optional */ }
    })();
    return () => { alive = false; };
  }, [place, lang]);

  // the elsewhr layer: everyone whose destination is this place
  useEffect(() => {
    if (!place) { setLoading(false); return; }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, name, photo, headline, accent, mindset, dest_term, dest_program, dest_status")
        .ilike("dest_place", place)
        .order("id", { ascending: false })
        .limit(60);
      if (alive) {
        setPeople(((data ?? []) as Person[]).filter((p) => !!p.user_id));
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [place]);

  const already = useMemo(() => people.filter((p) => p.dest_status === "current"), [people]);
  const arriving = useMemo(() => people.filter((p) => p.dest_status !== "current"), [people]);

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
