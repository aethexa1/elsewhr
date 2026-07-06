"use client";

// elsewhr — build your profile, conversation-style (replaces app/create/page.tsx)

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Tile = { claim: string; image: string; result: string; field: string; vouch: string };

const MINDSET_OPTIONS = [
  "builder", "curious", "ships fast", "night owl", "team player",
  "self-taught", "detail-obsessed", "big dreamer", "disciplined", "creative",
];

const emptyTile: Tile = { claim: "", image: "", result: "", field: "", vouch: "" };

export default function CreatePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [seeking, setSeeking] = useState("");
  const [mindset, setMindset] = useState<string[]>([]);
  const [learning, setLearning] = useState("");
  const [goal, setGoal] = useState("");
  const [tiles, setTiles] = useState<Tile[]>([{ ...emptyTile }]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
      else setUserId(data.user.id);
    });
  }, [router]);

  function toggleMindset(tag: string) {
    setMindset((m) =>
      m.includes(tag) ? m.filter((t) => t !== tag) : m.length < 5 ? [...m, tag] : m
    );
  }

  function updateTile(i: number, key: keyof Tile, value: string) {
    setTiles((t) => t.map((tile, idx) => (idx === i ? { ...tile, [key]: value } : tile)));
  }

  async function publish() {
    const realTiles = tiles.filter((t) => t.claim.trim());
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.from("profiles").insert({
      user_id: userId,
      name: name.trim(),
      headline: headline.trim(),
      location: location.trim(),
      seeking: seeking.trim(),
      mindset,
      learning: learning.trim(),
      goal: goal.trim(),
      artifacts: realTiles,
    });
    if (error) {
      setMsg(error.message);
      setBusy(false);
    } else {
      router.push("/");
    }
  }

  // ---- the guided steps ----
  const steps = [
    {
      guide: "Hey — I'm your bowerbird. I'll help you get seen. First: what's your name?",
      hint: "The real one people call you.",
      valid: name.trim().length > 0,
      body: (
        <input autoFocus className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sofia Marin" />
      ),
    },
    {
      guide: `Nice to meet you${name ? ", " + name.split(" ")[0] : ""}. Now the big one — what do you HAVE? One line.`,
      hint: "Skills, experience, an idea — say it plainly. \u201CWarehouse ops, 6 years, no degree\u201D beats \u201Cmotivated professional\u201D every time.",
      valid: headline.trim().length > 0,
      body: (
        <input autoFocus className={inputCls} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Warehouse operations — 6 years. No degree. Started in fast food." />
      ),
    },
    {
      guide: "Where in the world are you?",
      hint: "City works. This helps nearby people find you. (Skippable.)",
      valid: true,
      body: (
        <input autoFocus className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Rancho Cucamonga, CA" />
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
              className={`px-4 py-2 rounded-full border-2 border-[#1c1410] text-[14px] font-medium transition-colors ${
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
      hint: "A number makes it stronger. A photo link makes it real (photo upload from your phone is coming). \u201CHardworking\u201D is a claim — \u201Ccut errors 40%\u201D is proof.",
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
              <input className={`${inputCls} mt-3`} value={tile.image} onChange={(e) => updateTile(i, "image", e.target.value)} placeholder="Photo link (optional) — https://…" />
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
      guide: `That's a real profile, ${name ? name.split(" ")[0] : "friend"}. Ready to be seen?`,
      hint: "You own this. Edit or delete anytime. Never inflated — that's the elsewhr rule.",
      valid: true,
      body: (
        <div className="bg-white/60 border-2 border-[#1c1410] rounded-2xl p-5 text-[15px] leading-relaxed">
          <p className="font-[Syne] font-bold text-xl">{name || "—"}</p>
          <p className="mt-1">{headline || "—"}</p>
          {seeking && <p className="mt-2 text-[#6b4eff] font-medium">Looking for: {seeking}</p>}
          {mindset.length > 0 && (
            <p className="mt-2 text-[13px] font-mono uppercase tracking-wide">{mindset.join(" · ")}</p>
          )}
          <p className="mt-2 text-[13px] text-[#6b5e52]">
            {tiles.filter((t) => t.claim.trim()).length} piece(s) of work attached
          </p>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex justify-center px-4 py-10">
      <div className="w-full max-w-[560px]">
        <div className="flex items-center justify-between mb-6">
          <div className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">
            elsewhr<span className="text-[#c8f000]">.</span>
          </div>
          {/* progress dots */}
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span key={i} className={`w-2 h-2 rounded-full ${i <= step ? "bg-[#c8f000]" : "bg-[#fff6ec]/40"}`} />
            ))}
          </div>
        </div>

        {/* bowerbird guide bubble */}
        <div className="flex items-start gap-3 mb-5">
          <Bird />
          <div className="bg-[#1c1410] text-[#fff6ec] rounded-2xl rounded-tl-none px-4 py-3 flex-1">
            <p className="text-[15px] font-medium leading-snug">{current.guide}</p>
            <p className="text-[12px] mt-1.5 text-[#c8f000]/90">{current.hint}</p>
          </div>
        </div>

        {/* the step body */}
        <div className="bg-[#fff6ec] rounded-3xl border-[3px] border-[#1c1410] shadow-[8px_8px_0_rgba(28,20,16,0.9)] p-6">
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
                {busy ? "Publishing…" : "Publish my profile 🐦"}
              </button>
            )}
          </div>

          {msg && <p className="mt-4 text-sm text-center text-[#b03a3a] font-medium">{msg}</p>}
        </div>

        <p className="font-mono text-[11px] text-[#fff6ec]/80 mt-6 text-center">
          step {step + 1} of {steps.length} · under 5 minutes · you own everything here
        </p>
      </div>
    </main>
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

