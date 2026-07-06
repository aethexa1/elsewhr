"use client";

// elsewhr — create your profile (replaces app/create/page.tsx)

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Tile = { claim: string; image: string; result: string; field: string; vouch: string };

const MINDSET_OPTIONS = [
  "builder", "curious", "ships fast", "night owl", "team player",
  "self-taught", "detail-obsessed", "big dreamer", "disciplined", "creative",
];

export default function CreatePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // profile fields
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [seeking, setSeeking] = useState("");
  const [mindset, setMindset] = useState<string[]>([]);
  const [learning, setLearning] = useState("");
  const [goal, setGoal] = useState("");
  const [tiles, setTiles] = useState<Tile[]>([
    { claim: "", image: "", result: "", field: "", vouch: "" },
  ]);

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

  function addTile() {
    if (tiles.length < 3) setTiles([...tiles, { claim: "", image: "", result: "", field: "", vouch: "" }]);
  }

  async function saveProfile() {
    if (!name.trim() || !headline.trim()) {
      setMsg("Name and headline are required.");
      return;
    }
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

  const inputCls =
    "w-full px-4 py-3 rounded-xl border-2 border-[#1c1410] bg-white outline-none focus:border-[#6b4eff] text-[15px]";
  const labelCls = "block font-mono text-[10px] uppercase tracking-widest mb-1 mt-4";

  return (
    <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex justify-center px-4 py-10">
      <div className="w-full max-w-[560px]">
        <div className="flex items-center justify-between mb-6">
          <div className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">
            elsewhr<span className="text-[#c8f000]">.</span>
          </div>
        </div>

        <div className="bg-[#fff6ec] rounded-3xl border-[3px] border-[#1c1410] shadow-[8px_8px_0_rgba(28,20,16,0.9)] p-6">
          <h1 className="font-[Syne] font-extrabold text-2xl leading-tight">
            Build your profile
          </h1>
          <p className="text-sm mt-1 mb-2 text-[#6b5e52]">
            Show what you have. Say what you&apos;re looking for. Under 5 minutes.
          </p>

          {/* identity */}
          <label className={labelCls}>Your name *</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sofia Marin" />

          <label className={labelCls}>What you have — one line *</label>
          <input className={inputCls} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Warehouse operations — 6 years. No degree. Started in fast food." />

          <label className={labelCls}>Location</label>
          <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Rancho Cucamonga, CA" />

          <label className={labelCls}>What you&apos;re looking for</label>
          <input className={inputCls} value={seeking} onChange={(e) => setSeeking(e.target.value)} placeholder="A team that values ownership · same-mindset builders" />

          {/* mindset */}
          <label className={labelCls}>Your mindset (pick up to 5)</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {MINDSET_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleMindset(tag)}
                className={`px-3 py-1.5 rounded-full border-2 border-[#1c1410] text-[13px] font-medium transition-colors ${
                  mindset.includes(tag) ? "bg-[#6b4eff] text-[#fff6ec] border-[#6b4eff]" : "bg-transparent"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <label className={labelCls}>Now learning</label>
          <input className={inputCls} value={learning} onChange={(e) => setLearning(e.target.value)} placeholder="Kubernetes · public speaking · Spanish" />

          <label className={labelCls}>Future goal</label>
          <input className={inputCls} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Run my own operations consultancy" />

          {/* work tiles */}
          <h2 className="font-[Syne] font-bold text-lg mt-8 mb-1">Your work</h2>
          <p className="text-[13px] text-[#6b5e52] mb-3">
            Real things you&apos;ve done. A photo link makes it stronger (photo upload coming next).
          </p>

          {tiles.map((tile, i) => (
            <div key={i} className="border-2 border-dashed border-[#1c1410]/40 rounded-2xl p-4 mb-4">
              <label className={labelCls} style={{ marginTop: 0 }}>What you did *</label>
              <input className={inputCls} value={tile.claim} onChange={(e) => updateTile(i, "claim", e.target.value)} placeholder="Cut mis-ships 40% with a labeling system I built" />

              <label className={labelCls}>Photo link (optional)</label>
              <input className={inputCls} value={tile.image} onChange={(e) => updateTile(i, "image", e.target.value)} placeholder="https://…" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Result</label>
                  <input className={inputCls} value={tile.result} onChange={(e) => updateTile(i, "result", e.target.value)} placeholder="40% fewer errors" />
                </div>
                <div>
                  <label className={labelCls}>Field</label>
                  <input className={inputCls} value={tile.field} onChange={(e) => updateTile(i, "field", e.target.value)} placeholder="Operations" />
                </div>
              </div>

              <label className={labelCls}>A vouch (optional)</label>
              <input className={inputCls} value={tile.vouch} onChange={(e) => updateTile(i, "vouch", e.target.value)} placeholder='"She runs the floor better than managers twice her pay." — site lead' />
            </div>
          ))}

          {tiles.length < 3 && (
            <button
              type="button"
              onClick={addTile}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#1c1410]/50 text-sm font-medium hover:bg-[#1c1410]/5"
            >
              + add another piece of work
            </button>
          )}

          <button
            onClick={saveProfile}
            disabled={busy}
            className="w-full mt-6 py-3.5 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-[15px] hover:translate-y-[-2px] transition-transform disabled:opacity-50"
          >
            {busy ? "Saving…" : "Publish my profile"}
          </button>

          {msg && <p className="mt-4 text-sm text-center text-[#b03a3a] font-medium">{msg}</p>}
        </div>

        <p className="font-mono text-[11px] text-[#fff6ec]/80 mt-6 text-center">
          you own this. edit or delete anytime. never inflated.
        </p>
      </div>
    </main>
  );
}
