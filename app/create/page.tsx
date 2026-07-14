"use client";

// elsewhr — build/edit your profile with photo uploads (replaces app/create/page.tsx)

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLang, t } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Tile = { claim: string; image: string; result: string; field: string; vouch: string };

type ParsedProfile = {
  name?: string;
  headline?: string;
  location?: string;
  seeking?: string;
  mindset?: string[];
  learning?: string;
  goal?: string;
  work?: Partial<Tile>[];
};

type Coach = {
  example?: { claim?: string; result?: string; field?: string; vouch?: string };
  seeking?: string[];
  mindsetLikely?: string[];
  hints?: { photo?: string; seeking?: string; learning?: string; goal?: string; work?: string };
};

type Review = { strongest?: string; gaps?: string[]; verdict?: string };

type Geo = { name: string; admin1?: string; country?: string };

const MINDSET_OPTIONS = [
  "builder", "curious", "ships fast", "night owl", "team player",
  "self-taught", "detail-obsessed", "big dreamer", "disciplined", "creative",
];

const emptyTile: Tile = { claim: "", image: "", result: "", field: "", vouch: "" };

const ACCENTS = [
  { name: "grape", hex: "#6b4eff" },
  { name: "lime", hex: "#9ab800" },
  { name: "sky", hex: "#00a8b5" },
  { name: "coral", hex: "#e04a2a" },
  { name: "ink", hex: "#1c1410" },
  { name: "rose", hex: "#d94f8a" },
];

const DAYONE_STRINGS: Record<string, { badge: string; title: string; sub: string; ph: string; preview: string }> = {
  en: { badge: "day one", title: "nothing built yet? that's day one.", sub: "tell me your first step instead — here, that counts as evidence.", ph: "this month I will …", preview: "DAY ONE — first step:" },
  es: { badge: "día uno", title: "¿nada construido aún? eso es el día uno.", sub: "cuéntame tu primer paso — aquí, eso cuenta como prueba.", ph: "este mes voy a …", preview: "DÍA UNO — primer paso:" },
  pt: { badge: "dia um", title: "nada construído ainda? isso é o dia um.", sub: "me conta seu primeiro passo — aqui, isso conta como prova.", ph: "este mês eu vou …", preview: "DIA UM — primeiro passo:" },
  hi: { badge: "दिन एक", title: "अभी तक कुछ नहीं बनाया? यही है दिन एक।", sub: "मुझे अपना पहला कदम बताओ — यहाँ वही सबूत है।", ph: "इस महीने मैं …", preview: "दिन एक — पहला कदम:" },
  pl: { badge: "dzień 1", title: "nic jeszcze nie masz? to jest dzień pierwszy.", sub: "powiedz mi swój pierwszy krok — tutaj to się liczy jako dowód.", ph: "w tym miesiącu zamierzam …", preview: "DZIEŃ 1 — pierwszy krok:" },
  fr: { badge: "jour un", title: "rien de construit encore ? c'est le jour un.", sub: "dis-moi ton premier pas — ici, ça compte comme preuve.", ph: "ce mois-ci je vais …", preview: "JOUR UN — premier pas :" },
};

const DEST_STRINGS: Record<string, {
  guide: string; hint: string;
  placeLabel: string; placePh: string;
  programLabel: string; programPh: string;
  termLabel: string; termPh: string;
  statusLabel: string;
  statuses: { key: string; label: string }[];
}> = {
  en: {
    guide: "heading somewhere? new school, new city — tell me where, and I'll introduce you to people arriving with you.",
    hint: "totally skippable — if you're settled where you are, just hit Next.",
    placeLabel: "where you're headed", placePh: "UC Riverside · Chaffey College · a new city",
    programLabel: "program / field", programPh: "computer science · nursing · trade school",
    termLabel: "when", termPh: "fall 2026",
    statusLabel: "where you are in the journey",
    statuses: [
      { key: "applied", label: "applied" },
      { key: "accepted", label: "accepted" },
      { key: "arriving", label: "arriving" },
      { key: "current", label: "already there" },
      { key: "graduated", label: "graduated" },
    ],
  },
  es: {
    guide: "¿vas a algún lugar? nueva escuela, nueva ciudad — dime dónde y te presentaré a gente que llega contigo.",
    hint: "totalmente opcional — si ya estás establecido, dale a Siguiente.",
    placeLabel: "a dónde vas", placePh: "UC Riverside · Chaffey College · una nueva ciudad",
    programLabel: "programa / campo", programPh: "informática · enfermería · escuela técnica",
    termLabel: "cuándo", termPh: "otoño 2026",
    statusLabel: "en qué punto del camino estás",
    statuses: [
      { key: "applied", label: "apliqué" },
      { key: "accepted", label: "aceptado" },
      { key: "arriving", label: "llegando" },
      { key: "current", label: "ya estoy ahí" },
      { key: "graduated", label: "graduado" },
    ],
  },
  pt: {
    guide: "indo para algum lugar? nova escola, nova cidade — me diz onde e eu te apresento pessoas chegando com você.",
    hint: "totalmente opcional — se você já está estabelecido, é só clicar em Próximo.",
    placeLabel: "para onde você vai", placePh: "UC Riverside · Chaffey College · uma nova cidade",
    programLabel: "programa / área", programPh: "computação · enfermagem · escola técnica",
    termLabel: "quando", termPh: "outono 2026",
    statusLabel: "em que ponto da jornada você está",
    statuses: [
      { key: "applied", label: "apliquei" },
      { key: "accepted", label: "aceito" },
      { key: "arriving", label: "chegando" },
      { key: "current", label: "já estou lá" },
      { key: "graduated", label: "formado" },
    ],
  },
  hi: {
    guide: "कहीं जा रहे हो? नया स्कूल, नया शहर — मुझे बताओ कहाँ, और मैं तुम्हें उन लोगों से मिलाऊँगा जो तुम्हारे साथ पहुँच रहे हैं।",
    hint: "पूरी तरह वैकल्पिक — अगर तुम जहाँ हो वहीं ठीक हो, तो बस Next दबाओ।",
    placeLabel: "कहाँ जा रहे हो", placePh: "UC Riverside · Chaffey College · एक नया शहर",
    programLabel: "प्रोग्राम / क्षेत्र", programPh: "कंप्यूटर साइंस · नर्सिंग · ट्रेड स्कूल",
    termLabel: "कब", termPh: "फ़ॉल 2026",
    statusLabel: "सफ़र में कहाँ हो",
    statuses: [
      { key: "applied", label: "आवेदन किया" },
      { key: "accepted", label: "स्वीकृत" },
      { key: "arriving", label: "पहुँच रहा हूँ" },
      { key: "current", label: "पहले से वहाँ हूँ" },
      { key: "graduated", label: "स्नातक" },
    ],
  },
  pl: {
    guide: "wybierasz się gdzieś? nowa szkoła, nowe miasto — powiedz mi gdzie, a przedstawię ci ludzi, którzy przybywają razem z tobą.",
    hint: "całkowicie opcjonalne — jeśli jesteś już na miejscu, po prostu kliknij Dalej.",
    placeLabel: "dokąd zmierzasz", placePh: "UC Riverside · Chaffey College · nowe miasto",
    programLabel: "kierunek / dziedzina", programPh: "informatyka · pielęgniarstwo · szkoła zawodowa",
    termLabel: "kiedy", termPh: "jesień 2026",
    statusLabel: "gdzie jesteś w tej podróży",
    statuses: [
      { key: "applied", label: "aplikowałem" },
      { key: "accepted", label: "przyjęty" },
      { key: "arriving", label: "przybywam" },
      { key: "current", label: "już tam jestem" },
      { key: "graduated", label: "absolwent" },
    ],
  },
  fr: {
    guide: "tu pars quelque part ? nouvelle école, nouvelle ville — dis-moi où, et je te présenterai ceux qui arrivent avec toi.",
    hint: "totalement facultatif — si tu es déjà installé, clique simplement sur Suivant.",
    placeLabel: "où tu vas", placePh: "UC Riverside · Chaffey College · une nouvelle ville",
    programLabel: "programme / domaine", programPh: "informatique · soins infirmiers · école de métiers",
    termLabel: "quand", termPh: "automne 2026",
    statusLabel: "où tu en es dans le parcours",
    statuses: [
      { key: "applied", label: "candidature envoyée" },
      { key: "accepted", label: "accepté" },
      { key: "arriving", label: "j'arrive" },
      { key: "current", label: "déjà sur place" },
      { key: "graduated", label: "diplômé" },
    ],
  },
};

const SOFIA = {
  claim: "Cut mis-ships 40% with a labeling system I built",
  result: "40% fewer errors",
  field: "Operations",
  vouch: "\u201CSofia runs the floor better than managers twice her pay.\u201D — site lead",
};

export default function CreatePage() {
  const { lang } = useLang();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [seeking, setSeeking] = useState("");
  const [mindset, setMindset] = useState<string[]>([]);
  const [learning, setLearning] = useState("");
  const [goal, setGoal] = useState("");
  const [tiles, setTiles] = useState<Tile[]>([{ ...emptyTile }]);
  const [dayOne, setDayOne] = useState("");
  const [destPlace, setDestPlace] = useState("");
  const [destProgram, setDestProgram] = useState("");
  const [destTerm, setDestTerm] = useState("");
  const [destStatus, setDestStatus] = useState("");
  const [accent, setAccent] = useState("#6b4eff");
  const [resume, setResume] = useState("");
  const [parsing, setParsing] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<ParsedProfile | null>(null);
  const [showExample, setShowExample] = useState(false);
  const [coach, setCoach] = useState<Coach | null>(null);
  const coachedFor = useRef<string>("");
  const [review, setReview] = useState<Review | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/login");
        return;
      }
      setUserId(auth.user.id);

      const { data: existing } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existing) {
        setExistingId(existing.id);
        setName(existing.name ?? "");
        setPhoto(existing.photo ?? "");
        setHeadline(existing.headline ?? "");
        setLocation(existing.location ?? "");
        setWebsite(existing.website ?? "");
        setSeeking(existing.seeking ?? "");
        setMindset(Array.isArray(existing.mindset) ? existing.mindset : []);
        setLearning(existing.learning ?? "");
        setGoal(existing.goal ?? "");
        setAccent(existing.accent ?? "#6b4eff");
        setDayOne(existing.day_one ?? "");
        setDestPlace(existing.dest_place ?? "");
        setDestProgram(existing.dest_program ?? "");
        setDestTerm(existing.dest_term ?? "");
        setDestStatus(existing.dest_status ?? "");
        const arts = Array.isArray(existing.artifacts) ? existing.artifacts : [];
        setTiles(arts.length > 0 ? arts : [{ ...emptyTile }]);
      }
      setLoading(false);
    }
    init();
  }, [router]);

  function toggleMindset(tag: string) {
    setMindset((m) =>
      m.includes(tag) ? m.filter((t) => t !== tag) : m.length < 5 ? [...m, tag] : m
    );
  }

  function updateTile(i: number, key: keyof Tile, value: string) {
    setTiles((t) => t.map((tile, idx) => (idx === i ? { ...tile, [key]: value } : tile)));
  }

  // fire-and-forget: the bird studies the headline and tailors what comes next
  async function fetchCoach() {
    const key = headline.trim().toLowerCase();
    if (!key || coachedFor.current === key) return;
    coachedFor.current = key;
    try {
      const { data: sess } = await supabase.auth.getSession();
      const r = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sess.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ name, headline, location, lang }),
      });
      const data = await r.json();
      if (r.ok && data.coach) setCoach(data.coach as Coach);
    } catch {
      // silent — static guidance remains
    }
  }

  // the bird's final read — advice only; the human decides
  async function fetchReview() {
    setReviewBusy(true);
    setReview(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const r = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sess.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          mode: "review",
          lang,
          profile: {
            name,
            headline,
            location,
            seeking,
            mindset,
            learning,
            goal,
            hasPhoto: Boolean(photo),
            dayOne: dayOne.trim(),
            destination: destPlace.trim()
              ? { place: destPlace.trim(), program: destProgram.trim(), term: destTerm.trim(), status: destStatus }
              : null,
            work: tiles
              .filter((t) => t.claim.trim())
              .map((t) => ({
                claim: t.claim,
                result: t.result,
                field: t.field,
                vouch: t.vouch,
                hasImage: Boolean(t.image),
              })),
          },
        }),
      });
      const data = await r.json();
      if (r.ok && data.review) {
        setReview(data.review as Review);
      } else {
        setReview({ verdict: t(lang, "c.reviewResting") });
      }
    } catch {
      setReview({ verdict: t(lang, "c.reviewResting") });
    }
    setReviewBusy(false);
  }

  async function uploadImage(file: File): Promise<string | null> {
    if (!userId) return null;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("photos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      setMsg(t(lang, "c.uploadFailed") + error.message);
      return null;
    }
    const { data } = supabase.storage.from("photos").getPublicUrl(path);
    return data.publicUrl;
  }

  async function publish() {
    const realTiles = tiles.filter((t) => t.claim.trim());
    setBusy(true);
    setMsg(null);

    const payload = {
      user_id: userId,
      name: name.trim(),
      photo: photo.trim(),
      headline: headline.trim(),
      location: location.trim(),
      website: website.trim(),
      seeking: seeking.trim(),
      mindset,
      learning: learning.trim(),
      goal: goal.trim(),
      artifacts: realTiles,
      accent,
      day_one: dayOne.trim(),
      dest_place: destPlace.trim() || null,
      dest_program: destProgram.trim() || null,
      dest_term: destTerm.trim() || null,
      dest_status: destStatus || null,
    };

    const { error } = existingId
      ? await supabase.from("profiles").update(payload).eq("id", existingId)
      : await supabase.from("profiles").insert(payload);

    if (error) {
      setMsg(error.message);
      setBusy(false);
    } else {
      router.push("/");
    }
  }

  async function deleteProfile() {
    if (!existingId) return;
    const sure = window.confirm(
      t(lang, "c.deleteConfirm")
    );
    if (!sure) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").delete().eq("id", existingId);
    if (error) {
      setMsg(error.message);
      setBusy(false);
    } else {
      await supabase.auth.signOut();
      router.push("/");
    }
  }

  async function parseResume() {
    if (resume.trim().length < 40) {
      setMsg(t(lang, "c.resumeShort"));
      return;
    }
    setParsing(true);
    setMsg(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const r = await fetch("/api/parse-resume", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sess.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ resume }),
      });
      const data = await r.json();
      if (!r.ok) {
        setMsg(data.error || t(lang, "c.resumeFailed"));
      } else {
        const p = (data.profile || {}) as ParsedProfile;
        // the bird notices: does this resume belong to someone else?
        if (p.name && name && p.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
          setPendingProfile(p);
          setParsing(false);
          return;
        }
        applyParsed(p);
      }
    } catch {
      setMsg(t(lang, "c.somethingWrong"));
    }
    setParsing(false);
  }

  function applyParsed(p: ParsedProfile) {
    if (p.name && !name) setName(p.name);
    if (p.headline) setHeadline(p.headline);
    if (p.location) setLocation(p.location);
    if (p.seeking) setSeeking(p.seeking);
    if (Array.isArray(p.mindset) && p.mindset.length) setMindset(p.mindset.slice(0, 5));
    if (p.learning) setLearning(p.learning);
    if (p.goal) setGoal(p.goal);
    if (Array.isArray(p.work) && p.work.length) {
      setTiles(
        p.work.slice(0, 3).map((w) => ({
          claim: w.claim ?? "",
          image: "",
          result: w.result ?? "",
          field: w.field ?? "",
          vouch: "",
        }))
      );
    }
    setPendingProfile(null);
    setStep(1);
  }

  const ds = DAYONE_STRINGS[lang] || DAYONE_STRINGS.en;
  const dst = DEST_STRINGS[lang] || DEST_STRINGS.en;

  const ex = {
    claim: coach?.example?.claim || SOFIA.claim,
    result: coach?.example?.result || SOFIA.result,
    field: coach?.example?.field || SOFIA.field,
    vouch: coach?.example?.vouch || SOFIA.vouch,
  };
  const exampleIsTailored = Boolean(coach?.example?.claim);

  // likely-you tags float to the front of the list; the vocabulary never changes
  const likely = (coach?.mindsetLikely ?? []).filter((t) => MINDSET_OPTIONS.includes(t));
  const orderedMindset = [...likely, ...MINDSET_OPTIONS.filter((t) => !likely.includes(t))];

  const steps = [
    {
      guide: existingId
        ? `Welcome back${name ? ", " + name.split(" ")[0] : ""} — walk through and edit, or paste a resume below and I'll refresh the draft for you.`
        : "Got a resume? Paste it here and I'll do the boring part — your whole profile, drafted in seconds. Or skip and we'll build it together.",
      hint: t(lang, "c.resumeHint"),
      valid: true,
      body: (
        <div>
          {pendingProfile ? (
            <div className="border-[3px] border-[#b03a3a] bg-white rounded-2xl p-4">
              <p className="font-bold text-[15px] leading-snug">
                This resume says &ldquo;{pendingProfile.name}&rdquo; — but your profile is &ldquo;{name}&rdquo;.
              </p>
              <p className="text-[13px] mt-1 text-[#6b5e52]">
                elsewhr profiles must be your own real work. Nicknames are fine — someone else&apos;s resume is not.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPendingProfile(null);
                  setMsg(t(lang, "c.deleteCancelled"));
                }}
                className="w-full mt-3 py-3 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-[15px]"
              >
                No — keep my profile safe
              </button>
              <p className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => applyParsed(pendingProfile)}
                  className="font-mono text-[11px] underline text-[#6b5e52] hover:text-[#1c1410]"
                >
                  yes, this is really me (nickname / name change) — use it
                </button>
              </p>
            </div>
          ) : (
          <>
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder={t(lang, "c.resumePlaceholder")}
            rows={8}
            className="w-full px-4 py-3.5 rounded-xl border-2 border-[#1c1410] bg-white outline-none focus:border-[#6b4eff] text-[14px] leading-relaxed resize-y"
          />
          <button
            type="button"
            onClick={parseResume}
            disabled={parsing || resume.trim().length < 40}
            className="w-full mt-3 py-3 rounded-xl border-2 border-[#1c1410] bg-[#6b4eff] text-[#fff6ec] font-bold text-[15px] hover:translate-y-[-2px] transition-transform disabled:opacity-40"
          >
            {parsing ? t(lang, "c.resumeReading") : t(lang, "c.resumeDraft")}
          </button>
          <p className="mt-3 text-center text-[12px] text-[#6b5e52]">
            no resume handy? just hit Next — the bird will walk you through.
          </p>
          </>
          )}
        </div>
      ),
    },
    {
      guide: existingId
        ? `Welcome back${name ? ", " + name.split(" ")[0] : ""} — your profile's loaded. Walk through and change anything.`
        : t(lang, "c.nameGuide"),
      hint: existingId ? t(lang, "c.editingNote") : t(lang, "c.nameHint"),
      valid: name.trim().length > 0,
      body: (
        <div>
          <FieldLabel>{t(lang, "c.nameLabel")}</FieldLabel>
          <input autoFocus className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sofia Marin" />
        </div>
      ),
    },
    {
      guide: t(lang, "c.headlineGuide"),
      hint: t(lang, "c.headlineHint"),
      valid: headline.trim().length > 0,
      body: (
        <div>
          <FieldLabel>{t(lang, "c.headlineLabel")}</FieldLabel>
          <input autoFocus className={inputCls} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Warehouse operations — 6 years. No degree. Started in fast food." />
        </div>
      ),
    },
    {
      guide: t(lang, "c.photoGuide"),
      hint:
        coach?.hints?.photo ||
        "Take one now or pick from your gallery. Skippable, but profiles with faces get way more connection.",
      valid: true,
      body: (
        <PhotoPicker
          current={photo}
          rounded
          label={photo ? t(lang, "c.photoChange") : t(lang, "c.photoAdd")}
          onPick={async (file) => {
            setMsg(null);
            const url = await uploadImage(file);
            if (url) setPhoto(url);
          }}
        />
      ),
    },
    {
      guide: t(lang, "c.locationGuide"),
      hint: t(lang, "c.locationHint"),
      valid: true,
      body: (
        <div>
          <LocationPicker value={location} onChange={setLocation} />
          <div className="mt-4">
            <FieldLabel>{t(lang, "c.websiteLabel")}</FieldLabel>
            <input
              className={inputCls}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="yoursite.com · github.com/you · linkedin.com/in/you"
            />
          </div>
        </div>
      ),
    },
    {
      guide: dst.guide,
      hint: dst.hint,
      valid: true,
      body: (
        <div>
          <FieldLabel>{dst.placeLabel}</FieldLabel>
          <input autoFocus className={inputCls} value={destPlace} onChange={(e) => setDestPlace(e.target.value)} placeholder={dst.placePh} />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <FieldLabel>{dst.programLabel}</FieldLabel>
              <input className={inputCls} value={destProgram} onChange={(e) => setDestProgram(e.target.value)} placeholder={dst.programPh} />
            </div>
            <div>
              <FieldLabel>{dst.termLabel}</FieldLabel>
              <input className={inputCls} value={destTerm} onChange={(e) => setDestTerm(e.target.value)} placeholder={dst.termPh} />
            </div>
          </div>
          {destPlace.trim().length > 0 && (
            <div className="mt-4">
              <FieldLabel>{dst.statusLabel}</FieldLabel>
              <div className="flex flex-wrap gap-2 mt-1">
                {dst.statuses.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setDestStatus(destStatus === s.key ? "" : s.key)}
                    className={`px-4 py-2 rounded-full border-2 text-[13px] font-medium transition-all duration-150 active:scale-90 hover:scale-105 ${
                      destStatus === s.key ? "bg-[#6b4eff] text-[#fff6ec] border-[#6b4eff]" : "bg-white border-[#1c1410]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      guide: t(lang, "c.seekingGuide"),
      hint:
        coach?.hints?.seeking ||
        "A job? A co-founder? People with your fire? Be honest — this is how the right people find you.",
      valid: true,
      body: (
        <div>
          {coach?.seeking && coach.seeking.length > 0 && (
            <div className="mb-3">
              <p className="font-mono text-[10px] uppercase tracking-widest mb-2 text-[#6b4eff]">
                people like you often look for — tap one, or write your own
              </p>
              <div className="flex flex-wrap gap-2">
                {coach.seeking.slice(0, 3).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeeking(s)}
                    className={`px-4 py-2 rounded-full border-2 border-[#1c1410] text-[13px] font-medium transition-all duration-150 active:scale-90 hover:scale-105 ${
                      seeking === s ? "bg-[#6b4eff] text-[#fff6ec] border-[#6b4eff]" : "bg-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <FieldLabel>{t(lang, "c.seekingLabel")}</FieldLabel>
          <input className={inputCls} value={seeking} onChange={(e) => setSeeking(e.target.value)} placeholder="A team that values ownership · same-mindset builders" />
        </div>
      ),
    },
    {
      guide: t(lang, "c.mindsetGuide"),
      hint: likely.length
        ? "I starred the ones that often fit people with your background — but you know you best."
        : "This is how same-mindset people match with you. No wrong answers, only honest ones.",
      valid: true,
      body: (
        <div className="flex flex-wrap gap-2">
          {orderedMindset.map((tag) => (
            <button key={tag} type="button" onClick={() => toggleMindset(tag)}
              className={`px-4 py-2 rounded-full border-2 text-[14px] font-medium transition-all duration-150 active:scale-90 hover:scale-105 ${
                mindset.includes(tag)
                  ? "bg-[#6b4eff] text-[#fff6ec] border-[#6b4eff]"
                  : likely.includes(tag)
                  ? "bg-white border-[#6b4eff]"
                  : "bg-white border-[#1c1410]"
              }`}>
              {likely.includes(tag) && !mindset.includes(tag) ? "★ " : ""}{tag}
            </button>
          ))}
        </div>
      ),
    },
    {
      guide: t(lang, "c.learningGuide"),
      hint: coach?.hints?.learning || "Growth is attractive. \u201CNothing\u201D is fine too — skip if so.",
      valid: true,
      body: (
        <div>
          <FieldLabel>{t(lang, "c.learningLabel")}</FieldLabel>
          <input autoFocus className={inputCls} value={learning} onChange={(e) => setLearning(e.target.value)} placeholder="Kubernetes · public speaking · Spanish" />
        </div>
      ),
    },
    {
      guide: t(lang, "c.goalGuide"),
      hint: coach?.hints?.goal || t(lang, "c.goalHint"),
      valid: true,
      body: (
        <div>
          <FieldLabel>{t(lang, "c.goalLabel")}</FieldLabel>
          <input autoFocus className={inputCls} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Run my own operations consultancy" />
        </div>
      ),
    },
    {
      guide: t(lang, "c.workGuide"),
      hint:
        coach?.hints?.work ||
        "A number makes it stronger. A photo makes it real — snap the actual work. \u201CHardworking\u201D is a claim — \u201Ccut errors 40%\u201D is proof.",
      valid: tiles.some((t) => t.claim.trim().length > 0) || dayOne.trim().length >= 5,
      body: (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setShowExample((s) => !s)}
            className="self-start font-mono text-[11px] underline underline-offset-4 text-[#6b4eff]"
          >
            {showExample ? "hide the example" : "confused? see a finished example →"}
          </button>

          {showExample && (
            <div className="border-2 border-[#6b4eff] bg-[#6b4eff]/5 rounded-2xl p-4 text-[13px] leading-relaxed">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b4eff] mb-2">
                {exampleIsTailored
                  ? "an example from your world — copy the shape, not the words"
                  : t(lang, "c.workExample")}
              </p>
              <p><span className="font-bold">{t(lang, "c.workDid")}</span> {ex.claim}</p>
              <p className="mt-1"><span className="font-bold">{t(lang, "c.workResult")}</span> {ex.result}</p>
              <p className="mt-1"><span className="font-bold">{t(lang, "c.workField")}</span> {ex.field}</p>
              <p className="mt-1"><span className="font-bold">{t(lang, "c.workVouch")}</span> {ex.vouch}</p>
              <p className="mt-2 text-[#6b5e52]">
                Notice: one real thing, one number, one line from a person who saw it. That&apos;s the whole formula.
              </p>
            </div>
          )}

          {tiles.map((tile, i) => (
            <div key={i} className="border-2 border-dashed border-[#1c1410]/40 rounded-2xl p-4 bg-white/50">
              <FieldLabel>{t(lang, "c.workClaimLabel")}</FieldLabel>
              <input className={inputCls} value={tile.claim} onChange={(e) => updateTile(i, "claim", e.target.value)} placeholder={ex.claim} />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <FieldLabel>{t(lang, "c.workResultLabel")}</FieldLabel>
                  <input className={inputCls} value={tile.result} onChange={(e) => updateTile(i, "result", e.target.value)} placeholder={ex.result} />
                </div>
                <div>
                  <FieldLabel>{t(lang, "c.workFieldLabel")}</FieldLabel>
                  <input className={inputCls} value={tile.field} onChange={(e) => updateTile(i, "field", e.target.value)} placeholder={ex.field} />
                </div>
              </div>
              <div className="mt-3">
                <FieldLabel>{t(lang, "c.workPhotoLabel")}</FieldLabel>
                <PhotoPicker
                  current={tile.image}
                  label={tile.image ? t(lang, "c.workPhotoChange") : t(lang, "c.workPhotoAdd")}
                  onPick={async (file) => {
                    setMsg(null);
                    const url = await uploadImage(file);
                    if (url) updateTile(i, "image", url);
                  }}
                />
              </div>
              <div className="mt-3">
                <FieldLabel>{t(lang, "c.workVouchLabel")}</FieldLabel>
                <input className={inputCls} value={tile.vouch} onChange={(e) => updateTile(i, "vouch", e.target.value)} placeholder={ex.vouch} />
                <p className="mt-1.5 text-[11px] text-[#6b5e52] leading-snug">
                  A boss, coworker, customer, teammate — anyone who actually watched you do this work. Ask them for one honest sentence and put their role after it.
                </p>
              </div>
            </div>
          ))}
          {tiles.length < 3 && (
            <button type="button" onClick={() => setTiles([...tiles, { ...emptyTile }])}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#1c1410]/50 text-sm font-medium hover:bg-[#1c1410]/5">
              + add another piece of work
            </button>
          )}

          {!tiles.some((t) => t.claim.trim()) && (
            <div className="border-[3px] border-[#6b4eff] bg-[#6b4eff]/10 rounded-2xl p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b4eff] mb-1.5">
                {ds.badge} ◦
              </p>
              <p className="font-bold text-[15px] leading-snug">{ds.title}</p>
              <p className="text-[12.5px] text-[#6b5e52] mt-1 leading-snug">{ds.sub}</p>
              <input
                className={inputCls + " mt-3"}
                value={dayOne}
                onChange={(e) => setDayOne(e.target.value)}
                maxLength={140}
                placeholder={ds.ph}
              />
            </div>
          )}
        </div>
      ),
    },
    {
      guide: t(lang, "c.colorGuide"),
      hint: t(lang, "c.colorHint"),
      valid: true,
      body: (
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => setAccent(c.hex)}
              className={`w-16 h-16 rounded-2xl border-[3px] transition-all duration-150 hover:scale-105 active:scale-90 ${
                accent === c.hex ? "border-[#1c1410] scale-110 shadow-[4px_4px_0_rgba(28,20,16,0.6)]" : "border-transparent"
              }`}
              style={{ background: c.hex }}
              aria-label={c.name}
            />
          ))}
        </div>
      ),
    },
    {
      guide: t(lang, "c.finalGuide", { name: name ? name.split(" ")[0] : t(lang, "c.friend") }),
      hint: existingId
        ? "This UPDATES your existing profile. Want my honest read first? Your call — you decide what publishes."
        : "You own this. Edit or delete anytime. Want my honest read first? Your call — you decide what publishes.",
      valid: true,
      body: (
        <div>
          <div className="bg-white/60 border-2 border-[#1c1410] rounded-2xl p-5 text-[15px] leading-relaxed">
            <div className="flex items-center gap-3">
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt={name} className="w-14 h-14 rounded-full object-cover border-2 border-[#1c1410]" />
              )}
              <div>
                <p className="font-[Syne] font-bold text-xl">{name || "—"}</p>
                <p className="mt-0.5">{headline || "—"}</p>
              </div>
            </div>
            {destPlace.trim() && (
              <p className="mt-3 text-[13px] font-mono text-[#6b4eff]">
                → {destPlace.trim()}{destProgram.trim() ? " · " + destProgram.trim() : ""}{destTerm.trim() ? " · " + destTerm.trim() : ""}{destStatus ? " · " + destStatus : ""}
              </p>
            )}
            {seeking && <p className="mt-3 text-[#6b4eff] font-medium">Looking for: {seeking}</p>}
            {mindset.length > 0 && (
              <p className="mt-2 text-[13px] font-mono uppercase tracking-wide">{mindset.join(" · ")}</p>
            )}
            <div className="mt-3 flex items-center gap-2 text-[12px] font-mono">
              <span className="w-4 h-4 rounded-full inline-block border border-[#1c1410]/30" style={{ background: accent }} /> your color
            </div>
            {tiles.some((t) => t.claim.trim()) ? (
              <p className="mt-2 text-[13px] text-[#6b5e52]">
                {tiles.filter((t) => t.claim.trim()).length} piece(s) of work attached
              </p>
            ) : dayOne.trim() ? (
              <p className="mt-2 text-[13px]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#6b4eff]">{ds.preview}</span>{" "}
                {dayOne.trim()}
              </p>
            ) : (
              <p className="mt-2 text-[13px] text-[#6b5e52]">0 piece(s) of work attached</p>
            )}
          </div>

          {!review && (
            <button
              type="button"
              onClick={fetchReview}
              disabled={reviewBusy}
              className="w-full mt-4 py-3 rounded-xl border-2 border-[#1c1410] bg-[#6b4eff] text-[#fff6ec] font-bold text-[15px] hover:translate-y-[-2px] transition-transform disabled:opacity-50"
            >
              {reviewBusy ? t(lang, "c.reviewReading") : t(lang, "c.reviewAsk")}
            </button>
          )}

          {review && (
            <div className="mt-4 border-2 border-[#6b4eff] bg-[#6b4eff]/5 rounded-2xl p-4 text-[13px] leading-relaxed">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b4eff] mb-2">
                the bird&apos;s honest read — you decide what to do with it
              </p>
              {review.strongest && (
                <p><span className="font-bold">{t(lang, "c.reviewStrongest")}</span> {review.strongest}</p>
              )}
              {Array.isArray(review.gaps) && review.gaps.length > 0 && (
                <div className="mt-2">
                  <p className="font-bold">{t(lang, "c.reviewGaps")}</p>
                  {review.gaps.map((g, i) => (
                    <p key={i} className="mt-1">• {g}</p>
                  ))}
                </div>
              )}
              {review.verdict && <p className="mt-2 text-[#6b5e52]">{review.verdict}</p>}
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => { setReview(null); setStep(0); }}
                  className="flex-1 py-2.5 rounded-xl border-2 border-[#1c1410] bg-white font-bold text-[13px]"
                >
                  ← Go improve it
                </button>
                <button
                  type="button"
                  onClick={() => setReview(null)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-[#1c1410] bg-white font-bold text-[13px]"
                >
                  Dismiss — I&apos;m happy
                </button>
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const HEADLINE_STEP = 2;

  function goNext() {
    if (!current.valid) return;
    if (step === HEADLINE_STEP) fetchCoach(); // fire-and-forget; never blocks
    setStep(step + 1);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#ff5d3b] flex items-center justify-center">
        <p className="font-mono text-sm text-[#fff6ec]">{t(lang, "c.loading")}</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#ff5d3b] text-[#1c1410] flex justify-center px-4 py-10 overflow-hidden">
      <style>{`
        @keyframes rise { from { opacity:0; transform:translateY(22px);} to { opacity:1; transform:none;} }
        @keyframes drift1 { 0%,100% { transform:translate(0,0) scale(1);} 50% { transform:translate(35px,-25px) scale(1.06);} }
        @keyframes bob { 0%,100% { transform:translateY(0);} 50% { transform:translateY(-6px);} }
        .rise { animation: rise .45s cubic-bezier(.2,.7,.3,1) both; }
        .bob { animation: bob 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .rise,.bob,.blob { animation:none !important; } }
      `}</style>
      <div aria-hidden className="blob absolute -top-20 -right-24 w-96 h-96 rounded-full bg-[#c8f000] opacity-[0.12] blur-3xl" style={{ animation: "drift1 16s ease-in-out infinite" }} />
      <div aria-hidden className="blob absolute bottom-0 -left-28 w-[26rem] h-[26rem] rounded-full bg-[#6b4eff] opacity-[0.12] blur-3xl" style={{ animation: "drift1 21s ease-in-out infinite reverse" }} />
      <div className="relative w-full max-w-[560px]">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">
            elsewhr<span className="text-[#c8f000]">.</span>
          </Link>
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i <= step ? "bg-[#c8f000] scale-110" : "bg-[#fff6ec]/40"}`} />
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 mb-5">
          <span className="bob inline-block"><Bird /></span>
          <div key={`g${step}`} className="rise bg-[#1c1410] text-[#fff6ec] rounded-2xl rounded-tl-none px-4 py-3 flex-1">
            <p className="text-[15px] font-medium leading-snug">{current.guide}</p>
            <p className="text-[12px] mt-1.5 text-[#c8f000]/90">{current.hint}</p>
          </div>
        </div>

        <div key={`s${step}`} className="rise bg-[#fff6ec] rounded-3xl border-[3px] border-[#1c1410] shadow-[8px_8px_0_rgba(28,20,16,0.9)] p-6" style={{ animationDelay: "70ms" }}>
          {current.body}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)}
                className="px-5 py-3 rounded-xl border-2 border-[#1c1410] bg-white font-bold text-sm">
                ← Back
              </button>
            )}
            {!isLast ? (
              <button onClick={goNext} disabled={!current.valid}
                className="flex-1 py-3 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-[15px] hover:translate-y-[-2px] transition-transform disabled:opacity-40">
                Next →
              </button>
            ) : (
              <button onClick={publish} disabled={busy}
                className="flex-1 py-3 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-[15px] hover:translate-y-[-2px] transition-transform disabled:opacity-50">
                {busy ? (existingId ? t(lang, "c.updating") : t(lang, "c.publishing")) : existingId ? t(lang, "c.update") : t(lang, "c.publish")}
              </button>
            )}
          </div>

          {msg && <p className="mt-4 text-sm text-center text-[#b03a3a] font-medium">{msg}</p>}
        </div>

        <p className="font-mono text-[11px] text-[#fff6ec]/80 mt-6 text-center">
          step {step + 1} of {steps.length} · under 5 minutes · you own everything here
        </p>
        <p className="mt-2 text-center">
          <Link href="/" className="font-mono text-[11px] text-[#fff6ec]/70 underline underline-offset-4 hover:text-[#fff6ec]">
            ← back to elsewhr
          </Link>
        </p>
        {existingId && isLast && (
          <p className="mt-3 text-center">
            <button
              onClick={deleteProfile}
              disabled={busy}
              className="font-mono text-[11px] text-[#fff6ec]/60 underline hover:text-[#fff6ec]"
            >
              delete my profile from elsewhr
            </button>
          </p>
        )}
      </div>
    </main>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-mono text-[10px] uppercase tracking-widest mb-1 text-[#6b5e52]">
      {children}
    </label>
  );
}

function LocationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { lang } = useLang();
  const [q, setQ] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=6&language=en&format=json`
        );
        const d = await r.json();
        const s = ((d.results ?? []) as Geo[]).map((x) =>
          [x.name, x.admin1, x.country].filter(Boolean).join(", ")
        );
        setSuggestions([...new Set(s)]);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <div className="relative">
      <FieldLabel>{t(lang, "c.locationLabel")}</FieldLabel>
      <input
        autoFocus
        className={inputCls}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          onChange(e.target.value);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={t(lang, "c.locationPlaceholder")}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border-2 border-[#1c1410] rounded-xl overflow-hidden shadow-[4px_4px_0_rgba(28,20,16,0.5)]">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => {
                setQ(s);
                onChange(s);
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2.5 text-[14px] hover:bg-[#c8f000]/40 border-b border-[#1c1410]/10 last:border-b-0"
            >
              📍 {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoPicker({
  current,
  onPick,
  label,
  rounded,
}: {
  current: string;
  onPick: (file: File) => Promise<void>;
  label: string;
  rounded?: boolean;
}) {
  const { lang } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="flex items-center gap-4">
      {current ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current}
          alt="preview"
          className={`${rounded ? "w-24 h-24 rounded-full" : "w-28 h-20 rounded-xl"} object-cover border-2 border-[#1c1410]`}
        />
      ) : (
        <div
          className={`${rounded ? "w-24 h-24 rounded-full" : "w-28 h-20 rounded-xl"} border-2 border-dashed border-[#1c1410]/40 flex items-center justify-center text-2xl bg-white/60`}
        >
          {rounded ? "🙂" : "📷"}
        </div>
      )}
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2.5 rounded-xl border-2 border-[#1c1410] bg-white font-bold text-sm hover:translate-y-[-2px] transition-transform disabled:opacity-50"
        >
          {uploading ? t(lang, "c.uploading") : label}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              setUploading(true);
              await onPick(file);
              setUploading(false);
            }
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-4 py-3.5 rounded-xl border-2 border-[#1c1410] bg-white outline-none focus:border-[#6b4eff] text-[16px]";

function Bird() {
  return (
    <svg width="44" height="49" viewBox="0 0 300 340" xmlns="http://www.w3.org/2000/svg" className="flex-none mt-1">
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
