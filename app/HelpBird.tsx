"use client";

// elsewhr — the help bird: a chatbox in the corner of every page.
// New file: app/HelpBird.tsx (mounted globally in app/layout.tsx)
// Fixes what it can, reports everything home. Nobody is ever stuck alone.

import { useState, useRef, useEffect } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function HelpBird() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [greet, setGreet] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  // the bird says hello once per session — then keeps quiet
  useEffect(() => {
    try {
      if (sessionStorage.getItem("wh_help_greeted")) return;
    } catch { /* private mode */ }
    const id = window.setTimeout(() => setGreet(true), 4500);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (open || !greet) return;
    const id = window.setTimeout(() => {
      setGreet(false);
      try { sessionStorage.setItem("wh_help_greeted", "1"); } catch { /* fine */ }
    }, 8000);
    return () => window.clearTimeout(id);
  }, [greet, open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  async function send() {
    const m = text.trim();
    if (!m || busy) return;
    setText("");
    const next: Msg[] = [...msgs, { role: "user", content: m }];
    setMsgs(next);
    setBusy(true);
    try {
      const r = await fetch("/api/help", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: m,
          page: typeof window !== "undefined" ? window.location.pathname + window.location.search : "",
          history: next.slice(-6),
        }),
      });
      const d = await r.json();
      setMsgs((cur) => [...cur, { role: "assistant", content: d.ok ? d.reply : "the bird is resting — try again 🐦" }]);
    } catch {
      setMsgs((cur) => [...cur, { role: "assistant", content: "the bird is resting — try again 🐦" }]);
    }
    setBusy(false);
  }

  return (
    <>
      {/* the greeting */}
      {greet && !open && (
        <button
          type="button"
          onClick={() => {
            setGreet(false);
            setOpen(true);
            try { sessionStorage.setItem("wh_help_greeted", "1"); } catch { /* fine */ }
          }}
          style={{ position: "fixed", right: 80, bottom: 26, zIndex: 60 }}
          className="px-4 py-2.5 rounded-2xl rounded-br-sm border-2 border-[#1c1410] bg-[#fff6ec] text-[#1c1410] text-[13px] font-bold shadow-[4px_4px_0_rgba(28,20,16,0.9)] animate-pulse"
        >
          need a hand? 🐦
        </button>
      )}

      {/* the perch */}
      <button
        type="button"
        aria-label="help"
        onClick={() => {
          setOpen(!open);
          setGreet(false);
          try { sessionStorage.setItem("wh_help_greeted", "1"); } catch { /* fine */ }
        }}
        style={{ position: "fixed", right: 18, bottom: 18, zIndex: 60 }}
        className="w-14 h-14 rounded-full border-[3px] border-[#1c1410] bg-[#c8f000] shadow-[4px_4px_0_#1c1410] text-[24px] flex items-center justify-center hover:translate-y-[-2px] transition-transform"
      >
        {open ? "×" : "🐦"}
      </button>

      {open && (
        <div
          style={{ position: "fixed", right: 18, bottom: 84, zIndex: 60, width: "min(92vw, 360px)" }}
          className="bg-[#fff6ec] text-[#1c1410] border-[3px] border-[#1c1410] rounded-3xl shadow-[8px_8px_0_rgba(28,20,16,0.9)] overflow-hidden flex flex-col"
        >
          <div className="bg-[#1c1410] text-[#fff6ec] px-4 py-3">
            <p className="font-bold text-[14px] leading-tight">🐦 need a hand?</p>
            <p className="text-[11px] text-[#fff6ec]/70 leading-snug">
              stuck, confused, found a bug? tell the bird — the founder reads everything.
            </p>
          </div>

          <div className="px-3 py-3 flex-1 overflow-y-auto flex flex-col gap-2" style={{ maxHeight: "45vh", minHeight: 120 }}>
            {msgs.length === 0 && (
              <p className="text-[12.5px] text-[#6b5e52] leading-snug px-1">
                try: &ldquo;i can&apos;t log in&rdquo; · &ldquo;my profile isn&apos;t showing&rdquo; · &ldquo;how do knocks work?&rdquo;
              </p>
            )}
            {msgs.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "self-end max-w-[85%] bg-[#6b4eff] text-white rounded-2xl rounded-br-md px-3 py-2 text-[13px] leading-snug"
                    : "self-start max-w-[85%] bg-white border-2 border-[#1c1410] rounded-2xl rounded-bl-md px-3 py-2 text-[13px] leading-snug"
                }
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="self-start bg-white border-2 border-[#1c1410] rounded-2xl rounded-bl-md px-3 py-2 text-[13px]">
                …
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t-2 border-[#1c1410]/15 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="type here…"
              maxLength={600}
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border-2 border-[#1c1410] bg-white text-[#1c1410] placeholder-[#6b5e52]/70 outline-none focus:border-[#6b4eff] text-[13.5px]"
            />
            <button
              type="button"
              onClick={send}
              disabled={busy || !text.trim()}
              className="px-4 py-2.5 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-[13px] disabled:opacity-40"
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
