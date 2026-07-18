"use client";

// elsewhr — compare: two schools, side by side. same course, less fees — now you can see it.
// New file: app/compare/page.tsx
// US schools get full Dept-of-Education data (via /api/school). Anyone can be compared by name.

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/lib/i18n";

type School = {
  name: string | null;
  city: string | null;
  state: string | null;
  url: string | null;
  ownership: number | null;
  size: number | null;
  admissionRate: number | null;
  tuitionIn: number | null;
  tuitionOut: number | null;
  netPrice: number | null;
  medianEarnings: number | null;
  programs: string[];
};

const STRINGS: Record<string, {
  title: string; sub: string; placeholder: string; compare: string;
  size: string; admit: string; tuitionIn: string; tuitionOut: string; net: string; earn: string;
  shared: string; cheaper: string; noData: string; notConfigured: string; back: string;
  publicS: string; privateS: string; forProfit: string; loading: string;
}> = {
  en: {
    title: "compare",
    sub: "two schools, side by side. sometimes the same course costs half as much next door.",
    placeholder: "school name…",
    compare: "compare",
    size: "students", admit: "admission rate", tuitionIn: "tuition (in-state)", tuitionOut: "tuition (out-of-state)",
    net: "avg net price / yr", earn: "median earnings after 10 yrs",
    shared: "programs both offer", cheaper: "same programs, lower sticker:",
    noData: "no US data for this one — it still counts, the numbers just live elsewhere.",
    notConfigured: "school data isn't switched on yet.",
    back: "← back to elsewhr",
    publicS: "public", privateS: "private nonprofit", forProfit: "private for-profit",
    loading: "pulling the numbers…",
  },
  es: {
    title: "comparar",
    sub: "dos escuelas, lado a lado. a veces el mismo curso cuesta la mitad al lado.",
    placeholder: "nombre de la escuela…",
    compare: "comparar",
    size: "estudiantes", admit: "tasa de admisión", tuitionIn: "matrícula (estatal)", tuitionOut: "matrícula (fuera del estado)",
    net: "precio neto prom. / año", earn: "ingresos medianos tras 10 años",
    shared: "programas que ambas ofrecen", cheaper: "mismos programas, menor precio:",
    noData: "sin datos de EE.UU. para esta — igual cuenta, los números viven en otro lado.",
    notConfigured: "los datos escolares aún no están activados.",
    back: "← volver a elsewhr",
    publicS: "pública", privateS: "privada sin fines de lucro", forProfit: "privada con fines de lucro",
    loading: "trayendo los números…",
  },
  pt: {
    title: "comparar",
    sub: "duas escolas, lado a lado. às vezes o mesmo curso custa metade ao lado.",
    placeholder: "nome da escola…",
    compare: "comparar",
    size: "estudantes", admit: "taxa de admissão", tuitionIn: "mensalidade (no estado)", tuitionOut: "mensalidade (fora do estado)",
    net: "preço líquido médio / ano", earn: "renda mediana após 10 anos",
    shared: "programas que ambas oferecem", cheaper: "mesmos programas, preço menor:",
    noData: "sem dados dos EUA para esta — ainda conta, os números vivem em outro lugar.",
    notConfigured: "os dados escolares ainda não estão ativados.",
    back: "← voltar ao elsewhr",
    publicS: "pública", privateS: "privada sem fins lucrativos", forProfit: "privada com fins lucrativos",
    loading: "buscando os números…",
  },
  hi: {
    title: "तुलना",
    sub: "दो संस्थान, आमने-सामने। कभी-कभी वही कोर्स बगल में आधी कीमत पर मिलता है।",
    placeholder: "संस्थान का नाम…",
    compare: "तुलना करो",
    size: "छात्र", admit: "प्रवेश दर", tuitionIn: "फ़ीस (राज्य में)", tuitionOut: "फ़ीस (राज्य से बाहर)",
    net: "औसत वास्तविक कीमत / वर्ष", earn: "10 साल बाद औसत कमाई",
    shared: "दोनों में उपलब्ध कोर्स", cheaper: "वही कोर्स, कम फ़ीस:",
    noData: "इसके लिए US डेटा नहीं — फिर भी मायने रखता है, आंकड़े कहीं और हैं।",
    notConfigured: "स्कूल डेटा अभी चालू नहीं है।",
    back: "← elsewhr पर वापस",
    publicS: "सरकारी", privateS: "निजी गैर-लाभकारी", forProfit: "निजी लाभकारी",
    loading: "आंकड़े ला रहे हैं…",
  },
  pl: {
    title: "porównaj",
    sub: "dwie szkoły, obok siebie. czasem ten sam kierunek kosztuje o połowę mniej obok.",
    placeholder: "nazwa szkoły…",
    compare: "porównaj",
    size: "studenci", admit: "wskaźnik przyjęć", tuitionIn: "czesne (w stanie)", tuitionOut: "czesne (poza stanem)",
    net: "śr. cena netto / rok", earn: "mediana zarobków po 10 latach",
    shared: "kierunki w obu", cheaper: "te same kierunki, niższa cena:",
    noData: "brak danych z USA — nadal się liczy, liczby mieszkają gdzie indziej.",
    notConfigured: "dane szkół nie są jeszcze włączone.",
    back: "← wróć do elsewhr",
    publicS: "publiczna", privateS: "prywatna non-profit", forProfit: "prywatna komercyjna",
    loading: "pobieram liczby…",
  },
  fr: {
    title: "comparer",
    sub: "deux écoles, côte à côte. parfois le même cursus coûte moitié moins à côté.",
    placeholder: "nom de l'école…",
    compare: "comparer",
    size: "étudiants", admit: "taux d'admission", tuitionIn: "frais (résident)", tuitionOut: "frais (non-résident)",
    net: "prix net moyen / an", earn: "revenu médian après 10 ans",
    shared: "cursus offerts par les deux", cheaper: "mêmes cursus, prix plus bas :",
    noData: "pas de données US pour celle-ci — elle compte quand même.",
    notConfigured: "les données scolaires ne sont pas encore activées.",
    back: "← retour à elsewhr",
    publicS: "publique", privateS: "privée à but non lucratif", forProfit: "privée à but lucratif",
    loading: "on récupère les chiffres…",
  },
};

const money = (n: number | null) => (n == null ? "—" : "$" + n.toLocaleString());
const pct = (n: number | null) => (n == null ? "—" : Math.round(n * 100) + "%");

function ComparePageInner() {
  const params = useSearchParams();
  const { lang } = useLang();
  const s = STRINGS[lang] || STRINGS.en;

  const [qa, setQa] = useState(params.get("a") || "");
  const [qb, setQb] = useState(params.get("b") || "");
  const [a, setA] = useState<School | null>(null);
  const [b, setB] = useState<School | null>(null);
  const [stateA, setStateA] = useState<"idle" | "loading" | "none" | "off">("idle");
  const [stateB, setStateB] = useState<"idle" | "loading" | "none" | "off">("idle");

  async function look(q: string, set: (v: School | null) => void, setSt: (v: "idle" | "loading" | "none" | "off") => void) {
    const t = q.trim();
    if (t.length < 3) return;
    setSt("loading");
    set(null);
    try {
      const r = await fetch("/api/school?q=" + encodeURIComponent(t));
      if (r.status === 503) { setSt("off"); return; }
      const d = await r.json();
      if (d.ok && d.school) { set(d.school as School); setSt("idle"); }
      else setSt("none");
    } catch { setSt("none"); }
  }

  // auto-run anything arriving via URL
  useEffect(() => {
    if (qa.trim().length >= 3) look(qa, setA, setStateA);
    if (qb.trim().length >= 3) look(qb, setB, setStateB);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sharedPrograms = a && b ? a.programs.filter((p) => b.programs.includes(p)) : [];
  const cheaper =
    a && b && a.tuitionIn != null && b.tuitionIn != null && sharedPrograms.length > 0
      ? (a.tuitionIn < b.tuitionIn ? a : b)
      : null;
  const savings =
    cheaper && a && b && a.tuitionIn != null && b.tuitionIn != null
      ? Math.abs(a.tuitionIn - b.tuitionIn)
      : 0;

  const ownershipLabel = (o: number | null) =>
    o === 1 ? s.publicS : o === 2 ? s.privateS : o === 3 ? s.forProfit : "";

  return (
    <main className="relative min-h-screen bg-[#ff5d3b] text-[#1c1410] flex justify-center px-4 py-8">
      <div className="w-full max-w-[760px]">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">
            elsewhr<span className="text-[#c8f000]">.</span>
          </Link>
          <Link href="/" className="font-mono text-[11px] text-[#fff6ec]/80 underline underline-offset-4 hover:text-[#fff6ec]">
            {s.back}
          </Link>
        </div>

        <h1 className="font-[Syne] font-extrabold text-3xl text-[#fff6ec]">⚖️ {s.title}</h1>
        <p className="mt-2 mb-6 text-[14px] text-[#fff6ec]/90 leading-snug">{s.sub}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([["a", qa, setQa, a, stateA, setA, setStateA], ["b", qb, setQb, b, stateB, setB, setStateB]] as const).map(
            ([key, q, setQ, school, st, set, setSt]) => (
              <div key={key} className="bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl p-5 shadow-[7px_7px_0_#1c1410]">
                <div className="flex gap-2">
                  <input value={q} onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") look(q, set, setSt); }}
                    placeholder={s.placeholder}
                    className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border-2 border-[#1c1410] bg-white outline-none focus:border-[#6b4eff] text-[14px]"
                  />
                  <button type="button" onClick={() => look(q, set, setSt)}
                    className="px-4 py-2.5 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-[13px] hover:translate-y-[-2px] transition-transform"
                  >
                    {s.compare}
                  </button>
                </div>

                {st === "loading" && <p className="mt-4 font-mono text-[12px] text-[#6b5e52]">{s.loading}</p>}
                {st === "none" && <p className="mt-4 text-[13px] text-[#6b5e52]">{s.noData}</p>}
                {st === "off" && <p className="mt-4 text-[13px] text-[#b03a3a]">{s.notConfigured}</p>}

                {school && (
                  <div className="mt-4">
                    <p className="font-[Syne] font-extrabold text-lg leading-tight">{school.name}</p>
                    <p className="text-[12px] text-[#6b5e52]">
                      {[school.city, school.state].filter(Boolean).join(", ")}
                      {school.ownership ? " · " + ownershipLabel(school.ownership) : ""}
                    </p>
                    <div className="mt-3 flex flex-col gap-1.5 text-[13.5px]">
                      <p><span className="font-bold">{s.size}:</span> {school.size == null ? "—" : school.size.toLocaleString()}</p>
                      <p><span className="font-bold">{s.admit}:</span> {pct(school.admissionRate)}</p>
                      <p><span className="font-bold">{s.tuitionIn}:</span> {money(school.tuitionIn)}</p>
                      <p><span className="font-bold">{s.tuitionOut}:</span> {money(school.tuitionOut)}</p>
                      <p><span className="font-bold">{s.net}:</span> {money(school.netPrice)}</p>
                      <p><span className="font-bold">{s.earn}:</span> {money(school.medianEarnings)}</p>
                    </div>
                    <p className="mt-3">
                      <Link href={"/w?place=" + encodeURIComponent(school.name || "")} className="font-mono text-[11.5px] font-bold text-[#6b4eff] underline underline-offset-4">
                        🐦 →
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {a && b && sharedPrograms.length > 0 && (
          <div className="mt-5 bg-[#1c1410] text-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl p-5 shadow-[7px_7px_0_rgba(28,20,16,0.35)]">
            {cheaper && savings > 0 && (
              <p className="text-[14.5px] font-bold mb-3">
                💸 {s.cheaper} <span className="text-[#c8f000]">{cheaper.name}</span> (−${savings.toLocaleString()}/yr)
              </p>
            )}
            <p className="font-mono text-[10.5px] uppercase tracking-widest text-[#fff6ec]/70 mb-2">
              {s.shared} · {sharedPrograms.length}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sharedPrograms.slice(0, 24).map((p) => (
                <span key={p} className="px-2.5 py-1 rounded-full bg-[#fff6ec]/10 border border-[#fff6ec]/30 text-[11px]">
                  {p}
                </span>
              ))}
              {sharedPrograms.length > 24 && (
                <span className="px-2.5 py-1 text-[11px] text-[#fff6ec]/60">+{sharedPrograms.length - 24}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <ComparePageInner />
    </Suspense>
  );
}
