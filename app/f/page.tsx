"use client";

// elsewhr — field worlds: pick what you're into, see its people everywhere and every school that teaches it.
// New file: app/f/page.tsx  ·  /f?q=cybersecurity
// People: global, from profiles. Schools: US Dept of Education, cheapest in-state first.

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/i18n";

type Person = {
  id: number;
  user_id?: string | null;
  name: string;
  photo?: string | null;
  headline?: string | null;
  location?: string | null;
  dest_place?: string | null;
  dest_program?: string | null;
  accent?: string | null;
};

type FieldSchool = {
  name: string; city: string | null; state: string | null;
  size: number | null; tuitionIn: number | null; tuitionOut: number | null;
};

const STRINGS: Record<string, {
  sub: string; people: string; nobody: string; schools: string; schoolsSub: string;
  tuition: string; students: string; noData: string; notConfigured: string; back: string;
  tryOne: string; searchPh: string; go: string; usNote: string; compare: string;
}> = {
  en: {
    sub: "a field is a world too — its people, and every school that teaches it.",
    people: "people in this field",
    nobody: "nobody here yet — claim it. put this field on your profile and you're the first face of it.",
    schools: "schools that teach it",
    schoolsSub: "cheapest in-state tuition first · US data",
    tuition: "in-state", students: "students",
    noData: "don't know this field yet — try one of these:",
    notConfigured: "school data isn't switched on yet.",
    back: "← back to elsewhr",
    tryOne: "try:",
    searchPh: "cybersecurity, nursing, welding…",
    go: "explore",
    usNote: "school list is US-only for now — people are worldwide.",
    compare: "⚖️ compare two schools →",
  },
  es: {
    sub: "un campo también es un mundo — su gente, y cada escuela que lo enseña.",
    people: "gente en este campo",
    nobody: "nadie aquí todavía — reclámalo. pon este campo en tu perfil y serás su primera cara.",
    schools: "escuelas que lo enseñan",
    schoolsSub: "matrícula estatal más barata primero · datos de EE.UU.",
    tuition: "estatal", students: "estudiantes",
    noData: "aún no conozco este campo — prueba uno de estos:",
    notConfigured: "los datos escolares aún no están activados.",
    back: "← volver a elsewhr",
    tryOne: "prueba:",
    searchPh: "ciberseguridad, enfermería, soldadura…",
    go: "explorar",
    usNote: "la lista de escuelas es solo de EE.UU. por ahora — la gente es mundial.",
    compare: "⚖️ comparar dos escuelas →",
  },
  pt: {
    sub: "uma área também é um mundo — sua gente, e cada escola que a ensina.",
    people: "pessoas nesta área",
    nobody: "ninguém aqui ainda — reivindique. coloque esta área no seu perfil e seja o primeiro rosto dela.",
    schools: "escolas que ensinam",
    schoolsSub: "mensalidade estadual mais barata primeiro · dados dos EUA",
    tuition: "no estado", students: "estudantes",
    noData: "ainda não conheço esta área — tente uma destas:",
    notConfigured: "os dados escolares ainda não estão ativados.",
    back: "← voltar ao elsewhr",
    tryOne: "tente:",
    searchPh: "cibersegurança, enfermagem, solda…",
    go: "explorar",
    usNote: "a lista de escolas é só dos EUA por enquanto — as pessoas são do mundo todo.",
    compare: "⚖️ comparar duas escolas →",
  },
  hi: {
    sub: "एक क्षेत्र भी एक दुनिया है — उसके लोग, और हर संस्थान जो उसे सिखाता है।",
    people: "इस क्षेत्र के लोग",
    nobody: "अभी यहाँ कोई नहीं — इसे अपनाओ। इसे अपनी प्रोफ़ाइल में जोड़ो और इसका पहला चेहरा बनो।",
    schools: "सिखाने वाले संस्थान",
    schoolsSub: "सबसे सस्ती राज्य फ़ीस पहले · US डेटा",
    tuition: "राज्य फ़ीस", students: "छात्र",
    noData: "यह क्षेत्र अभी नहीं जानता — इनमें से एक आज़माओ:",
    notConfigured: "स्कूल डेटा अभी चालू नहीं है।",
    back: "← elsewhr पर वापस",
    tryOne: "आज़माओ:",
    searchPh: "साइबर सुरक्षा, नर्सिंग, वेल्डिंग…",
    go: "देखो",
    usNote: "संस्थान सूची अभी US तक — लोग पूरी दुनिया से।",
    compare: "⚖️ दो संस्थानों की तुलना →",
  },
  pl: {
    sub: "kierunek to też świat — jego ludzie i każda szkoła, która go uczy.",
    people: "ludzie w tej dziedzinie",
    nobody: "nikogo tu jeszcze nie ma — zajmij to miejsce. dodaj tę dziedzinę do profilu i bądź jej pierwszą twarzą.",
    schools: "szkoły, które tego uczą",
    schoolsSub: "najtańsze czesne stanowe najpierw · dane z USA",
    tuition: "w stanie", students: "studenci",
    noData: "nie znam jeszcze tej dziedziny — spróbuj jednej z tych:",
    notConfigured: "dane szkół nie są jeszcze włączone.",
    back: "← wróć do elsewhr",
    tryOne: "spróbuj:",
    searchPh: "cyberbezpieczeństwo, pielęgniarstwo, spawanie…",
    go: "odkrywaj",
    usNote: "lista szkół na razie tylko z USA — ludzie z całego świata.",
    compare: "⚖️ porównaj dwie szkoły →",
  },
  fr: {
    sub: "un domaine est aussi un monde — ses gens, et chaque école qui l'enseigne.",
    people: "les gens de ce domaine",
    nobody: "personne ici encore — revendique-le. mets ce domaine sur ton profil et sois son premier visage.",
    schools: "écoles qui l'enseignent",
    schoolsSub: "frais résidents les moins chers d'abord · données US",
    tuition: "résident", students: "étudiants",
    noData: "je ne connais pas encore ce domaine — essaie l'un de ceux-ci :",
    notConfigured: "les données scolaires ne sont pas encore activées.",
    back: "← retour à elsewhr",
    tryOne: "essaie :",
    searchPh: "cybersécurité, soins infirmiers, soudure…",
    go: "explorer",
    usNote: "la liste d'écoles est US pour l'instant — les gens sont du monde entier.",
    compare: "⚖️ comparer deux écoles →",
  },
};

const money = (n: number | null) => (n == null ? "—" : "$" + n.toLocaleString());

function FieldPageInner() {
  const params = useSearchParams();
  const { lang } = useLang();
  const s = STRINGS[lang] || STRINGS.en;

  const [q, setQ] = useState(params.get("q") || "");
  const [active, setActive] = useState((params.get("q") || "").trim());
  const [people, setPeople] = useState<Person[]>([]);
  const [schools, setSchools] = useState<FieldSchool[] | null>(null);
  const [known, setKnown] = useState<string[]>([]);
  const [schoolState, setSchoolState] = useState<"idle" | "loading" | "unknown" | "off">("idle");
  const [loadingPeople, setLoadingPeople] = useState(false);

  useEffect(() => {
    const f = active.trim();
    if (f.length < 2) return;
    let alive = true;

    (async () => {
      setLoadingPeople(true);
      const like = "%" + f + "%";
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, name, photo, headline, location, dest_place, dest_program, accent")
        .or(
          `dest_program.ilike.${like},headline.ilike.${like},seeking.ilike.${like},learning.ilike.${like},goal.ilike.${like}`
        )
        .order("id", { ascending: false })
        .limit(40);
      if (alive) {
        setPeople(((data ?? []) as Person[]).filter((p) => !!p.user_id));
        setLoadingPeople(false);
      }
    })();

    (async () => {
      setSchoolState("loading");
      setSchools(null);
      try {
        const r = await fetch("/api/school?field=" + encodeURIComponent(f.toLowerCase()));
        if (r.status === 503) { setSchoolState("off"); return; }
        const d = await r.json();
        if (d.ok && Array.isArray(d.schools)) { setSchools(d.schools as FieldSchool[]); setSchoolState("idle"); }
        else if (d.ok && d.schools === null) { setKnown((d.known as string[]) ?? []); setSchoolState("unknown"); }
        else setSchoolState("unknown");
      } catch { setSchoolState("unknown"); }
    })();

    return () => { alive = false; };
  }, [active]);

  const explore = () => {
    const f = q.trim();
    if (f.length >= 2) setActive(f);
  };

  return (
    <main className="relative min-h-screen bg-[#ff5d3b] text-[#1c1410] flex justify-center px-4 py-8">
      <div className="w-full max-w-[820px]">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">
            elsewhr<span className="text-[#c8f000]">.</span>
          </Link>
          <Link href="/" className="font-mono text-[11px] text-[#fff6ec]/80 underline underline-offset-4 hover:text-[#fff6ec]">
            {s.back}
          </Link>
        </div>

        <h1 className="font-[Syne] font-extrabold text-3xl text-[#fff6ec] lowercase">🧭 {active || "fields"}</h1>
        <p className="mt-2 mb-5 text-[14px] text-[#fff6ec]/90 leading-snug">{s.sub}</p>

        <div className="flex gap-2 mb-8">
          <input value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") explore(); }}
            placeholder={s.searchPh}
            className="flex-1 min-w-0 px-4 py-3 rounded-2xl border-[3px] border-[#1c1410] bg-[#fff6ec] outline-none focus:border-[#6b4eff] text-[15px] shadow-[5px_5px_0_rgba(28,20,16,0.9)]"
          />
          <button type="button" onClick={explore}
            className="px-5 py-3 rounded-2xl border-[3px] border-[#1c1410] bg-[#c8f000] font-bold text-[14px] shadow-[5px_5px_0_rgba(28,20,16,0.9)] hover:translate-y-[-2px] transition-transform"
          >
            {s.go}
          </button>
        </div>

        {active && (
          <>
            {/* people first — they are the product */}
            <p className="font-mono text-[11px] uppercase tracking-widest text-[#fff6ec]/80 mb-3">
              {s.people} · {people.length}
            </p>
            {loadingPeople ? null : people.length === 0 ? (
              <div className="bg-[#1c1410] text-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl p-5 mb-8 shadow-[7px_7px_0_rgba(28,20,16,0.35)]">
                <p className="text-[14.5px] leading-snug">{s.nobody}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {people.map((p) => (
                  <Link key={p.id} href={"/p/" + p.id}
                    className="bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-2xl p-4 shadow-[5px_5px_0_rgba(28,20,16,0.9)] hover:translate-y-[-2px] transition-transform"
                    style={{ borderTopColor: p.accent || "#6b4eff", borderTopWidth: 6 }}
                  >
                    <div className="flex items-center gap-3">
                      {p.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photo} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-[#1c1410]" />
                      ) : (
                        <div className="w-11 h-11 rounded-full border-2 border-[#1c1410] flex items-center justify-center font-bold text-white" style={{ background: p.accent || "#6b4eff" }}>
                          {(p.name || "?").slice(0, 1)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-[Syne] font-extrabold text-[16px] leading-tight truncate">{p.name}</p>
                        <p className="text-[12px] text-[#6b5e52] truncate">
                          {p.dest_program?.trim() || p.headline?.trim() || ""}
                        </p>
                        {(p.dest_place || p.location) && (
                          <p className="text-[11.5px] font-bold text-[#6b4eff] truncate">
                            {p.dest_place?.trim() ? "→ " + p.dest_place.trim() : "📍 " + (p.location || "").trim()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* schools that teach it */}
            <div className="flex items-baseline justify-between mb-3">
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#fff6ec]/80">{s.schools}</p>
              <Link href="/compare" className="font-mono text-[11px] font-bold text-[#fff6ec] underline underline-offset-4">
                {s.compare}
              </Link>
            </div>

            {schoolState === "off" && (
              <p className="text-[13px] text-[#fff6ec]/90">{s.notConfigured}</p>
            )}
            {schoolState === "unknown" && (
              <div className="bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl p-5 shadow-[7px_7px_0_rgba(28,20,16,0.9)]">
                <p className="text-[13.5px]">{s.noData}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(known.length > 0 ? known : ["cybersecurity", "nursing", "business", "welding", "computer science"]).slice(0, 12).map((k) => (
                    <button key={k} type="button" onClick={() => { setQ(k); setActive(k); }}
                      className="px-3 py-1.5 rounded-full border-2 border-[#1c1410] bg-white text-[12px] font-bold hover:bg-[#c8f000]"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {Array.isArray(schools) && schools.length > 0 && (
              <div className="bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl p-5 shadow-[7px_7px_0_rgba(28,20,16,0.9)]">
                <p className="font-mono text-[10.5px] uppercase tracking-widest text-[#6b5e52] mb-3">{s.schoolsSub}</p>
                <div className="flex flex-col divide-y-2 divide-[#1c1410]/10">
                  {schools.map((sc) => (
                    <div key={sc.name} className="py-2.5 flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={"/w?place=" + encodeURIComponent(sc.name)} className="font-bold text-[14px] leading-tight underline decoration-2 underline-offset-2 decoration-[#6b4eff]/40 hover:decoration-[#6b4eff]">
                          {sc.name}
                        </Link>
                        <p className="text-[11.5px] text-[#6b5e52]">
                          {[sc.city, sc.state].filter(Boolean).join(", ")}
                          {sc.size ? " · " + sc.size.toLocaleString() + " " + s.students : ""}
                        </p>
                      </div>
                      <p className="font-bold text-[13.5px] whitespace-nowrap">
                        {money(sc.tuitionIn)} <span className="font-medium text-[11px] text-[#6b5e52]">{s.tuition}</span>
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 font-mono text-[10.5px] text-[#6b5e52]">{s.usNote}</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function FieldPage() {
  return (
    <Suspense fallback={null}>
      <FieldPageInner />
    </Suspense>
  );
}
