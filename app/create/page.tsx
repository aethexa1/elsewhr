"use client";

// elsewhr — build/edit your profile with photo uploads (replaces app/create/page.tsx)

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

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

export default function CreatePage() {
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
  const [seeking, setSeeking] = useState("");
  const [mindset, setMindset] = useState<string[]>([]);
  const [learning, setLearning] = useState("");
  const [goal, setGoal] = useState("");
  const [tiles, setTiles] = useState<Tile[]>([{ ...emptyTile }]);
  const [accent, setAccent] = useState("#6b4eff");
  const [resume, setResume] = useState("");
  const [parsing, setParsing] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<ParsedProfile | null>(null);

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
        setSeeking(existing.seeking ?? "");
        setMindset(Array.isArray(existing.mindset) ? existing.mindset : []);
        setLearning(existing.learning ?? "");
        setGoal(existing.goal ?? "");
        setAccent(existing.accent ?? "#6b4eff");
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

  async function uploadImage(file: File): Promise<string | null> {
    if (!userId) return null;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("photos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      setMsg("Upload failed: " + error.message);
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
      seeking: seeking.trim(),
      mindset,
      learning: learning.trim(),
      goal: goal.trim(),
      artifacts: realTiles,
      accent,
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
      "Delete your profile from elsewhr? This removes it completely and can't be undone."
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
      setMsg("Paste a bit more of your resume first.");
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
        setMsg(data.error || "Couldn't read that — try again.");
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
      setMsg("Something went wrong — try again.");
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

  const steps = [
    {
      guide: existingId
        ? `Welcome back${name ? ", " + name.split(" ")[0] : ""} — walk through and edit, or paste a resume below and I'll refresh the draft for you.`
        : "Got a resume? Paste it here and I'll do the boring part — your whole profile, drafted in seconds. Or skip and we'll build it together.",
      hint: "I only use what's actually in it. Never inflated — that's the rule I live by.",
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
                  setMsg("Good call — profile untouched.");
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
            placeholder="Paste your resume text here… (copy it from your PDF or doc)"
            rows={8}
            className="w-full px-4 py-3.5 rounded-xl border-2 border-[#1c1410] bg-white outline-none focus:border-[#6b4eff] text-[14px] leading-relaxed resize-y"
          />
          <button
            type="button"
            onClick={parseResume}
            disabled={parsing || resume.trim().length < 40}
            className="w-full mt-3 py-3 rounded-xl border-2 border-[#1c1410] bg-[#6b4eff] text-[#fff6ec] font-bold text-[15px] hover:translate-y-[-2px] transition-transform disabled:opacity-40"
          >
            {parsing ? "Reading your resume… 🐦" : "Draft my profile from this ✨"}
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
        : "Hey — I'm your bowerbird. I'll help you get seen. First: what's your name?",
      hint: existingId ? "Publishing at the end UPDATES your profile — no duplicates." : "The real one people call you.",
      valid: name.trim().length > 0,
      body: (
        <input autoFocus className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sofia Marin" />
      ),
    },
    {
      guide: "Add a photo of yourself — people connect with faces.",
      hint: "Take one now or pick from your gallery. Skippable, but profiles with faces get way more connection.",
      valid: true,
      body: (
        <PhotoPicker
          current={photo}
          rounded
          label={photo ? "Change photo" : "Add your photo"}
          onPick={async (file) => {
            setMsg(null);
            const url = await uploadImage(file);
            if (url) setPhoto(url);
          }}
        />
      ),
    },
    {
      guide: `Now the big one — what do you HAVE? One line.`,
      hint: "Skills, experience, an idea — say it plainly. \u201CWarehouse ops, 6 years, no degree\u201D beats \u201Cmotivated professional\u201D every time.",
      valid: headline.trim().length > 0,
      body: (
        <input autoFocus className={inputCls} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Warehouse operations — 6 years. No degree. Started in fast food." />
      ),
    },
    {
      guide: "Where in the world are you?",
      hint: "Start typing — I'll suggest cities. This helps nearby people find you. (Skippable.)",
      valid: true,
      body: (
        <LocationPicker value={location} onChange={setLocation} />
      ),
    },
    {
      guide: "What are you LOOKING for?",
      hint: "A job? A co-founder? People with your fire? Be honest — this is how the right people find you.",
      valid: true,
      body: (
        <input autoFocus className={inputCls} value={seeking} onChange={(e) => setSeeking(e.target.value)} placeholder="A team that values ownership · same-mindset builders" />
      ),
    },
    {
      guide: "Pick your mindset — up to 5 that are really you.",
      hint: "This is how same-mindset people match with you. No wrong answers, only honest ones.",
      valid: true,
      body: (
        <div className="flex flex-wrap gap-2">
          {MINDSET_OPTIONS.map((tag) => (
            <button key={tag} type="button" onClick={() => toggleMindset(tag)}
              className={`px-4 py-2 rounded-full border-2 border-[#1c1410] text-[14px] font-medium transition-all duration-150 active:scale-90 hover:scale-105 ${
                mindset.includes(tag) ? "bg-[#6b4eff] text-[#fff6ec] border-[#6b4eff]" : "bg-white"
              }`}>
              {tag}
            </button>
          ))}
        </div>
      ),
    },
    {
      guide: "What are you learning right now?",
      hint: "Growth is attractive. \u201CNothing\u201D is fine too — skip if so.",
      valid: true,
      body: (
        <input autoFocus className={inputCls} value={learning} onChange={(e) => setLearning(e.target.value)} placeholder="Kubernetes · public speaking · Spanish" />
      ),
    },
    {
      guide: "And where are you headed? One future goal.",
      hint: "Dream-sized is allowed.",
      valid: true,
      body: (
        <input autoFocus className={inputCls} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Run my own operations consultancy" />
      ),
    },
    {
      guide: "Now show me your work. Don't tell me you're good — show me ONE real thing you did.",
      hint: "A number makes it stronger. A photo makes it real — snap the actual work. \u201CHardworking\u201D is a claim — \u201Ccut errors 40%\u201D is proof.",
      valid: tiles.some((t) => t.claim.trim().length > 0),
      body: (
        <div className="flex flex-col gap-4">
          {tiles.map((tile, i) => (
            <div key={i} className="border-2 border-dashed border-[#1c1410]/40 rounded-2xl p-4 bg-white/50">
              <input className={inputCls} value={tile.claim} onChange={(e) => updateTile(i, "claim", e.target.value)} placeholder="What did you do? — Cut mis-ships 40% with a labeling system I built" />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <input className={inputCls} value={tile.result} onChange={(e) => updateTile(i, "result", e.target.value)} placeholder="Result — 40% fewer errors" />
                <input className={inputCls} value={tile.field} onChange={(e) => updateTile(i, "field", e.target.value)} placeholder="Field — Operations" />
              </div>
              <div className="mt-3">
                <PhotoPicker
                  current={tile.image}
                  label={tile.image ? "Change work photo" : "Add a photo of this work"}
                  onPick={async (file) => {
                    setMsg(null);
                    const url = await uploadImage(file);
                    if (url) updateTile(i, "image", url);
                  }}
                />
              </div>
              <input className={`${inputCls} mt-3`} value={tile.vouch} onChange={(e) => updateTile(i, "vouch", e.target.value)} placeholder='A vouch (optional) — "She runs the floor better than…" — site lead' />
            </div>
          ))}
          {tiles.length < 3 && (
            <button type="button" onClick={() => setTiles([...tiles, { ...emptyTile }])}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#1c1410]/50 text-sm font-medium hover:bg-[#1c1410]/5">
              + add another piece of work
            </button>
          )}
        </div>
      ),
    },
    {
      guide: "Pick your color — the one people will remember you by.",
      hint: "Your profile wears this everywhere. \u201CThe purple one with the watches\u201D sticks in memory.",
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
      guide: `That's a real profile, ${name ? name.split(" ")[0] : "friend"}. Ready to be seen?`,
      hint: existingId
        ? "This UPDATES your existing profile. You own this — never inflated."
        : "You own this. Edit or delete anytime. Never inflated — that's the elsewhr rule.",
      valid: true,
      body: (
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
          {seeking && <p className="mt-3 text-[#6b4eff] font-medium">Looking for: {seeking}</p>}
          {mindset.length > 0 && (
            <p className="mt-2 text-[13px] font-mono uppercase tracking-wide">{mindset.join(" · ")}</p>
          )}
          <div className="mt-3 flex items-center gap-2 text-[12px] font-mono">
            <span className="w-4 h-4 rounded-full inline-block border border-[#1c1410]/30" style={{ background: accent }} /> your color
          </div>
          <p className="mt-2 text-[13px] text-[#6b5e52]">
            {tiles.filter((t) => t.claim.trim()).length} piece(s) of work attached
          </p>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#ff5d3b] flex items-center justify-center">
        <p className="font-mono text-sm text-[#fff6ec]">loading your profile…</p>
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
          <div className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">
            elsewhr<span className="text-[#c8f000]">.</span>
          </div>
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
              <button onClick={() => current.valid && setStep(step + 1)} disabled={!current.valid}
                className="flex-1 py-3 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-[15px] hover:translate-y-[-2px] transition-transform disabled:opacity-40">
                Next →
              </button>
            ) : (
              <button onClick={publish} disabled={busy}
                className="flex-1 py-3 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-[15px] hover:translate-y-[-2px] transition-transform disabled:opacity-50">
                {busy ? (existingId ? "Updating…" : "Publishing…") : existingId ? "Update my profile 🐦" : "Publish my profile 🐦"}
              </button>
            )}
          </div>

          {msg && <p className="mt-4 text-sm text-center text-[#b03a3a] font-medium">{msg}</p>}
        </div>

        <p className="font-mono text-[11px] text-[#fff6ec]/80 mt-6 text-center">
          step {step + 1} of {steps.length} · under 5 minutes · you own everything here
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

function LocationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [q, setQ] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
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
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="relative">
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
        placeholder="Start typing your city…"
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
          {uploading ? "Uploading…" : label}
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
