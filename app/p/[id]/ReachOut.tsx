"use client";

// elsewhr — reach out: message a person, addresses stay private
// Replaces app/p/[id]/ReachOut.tsx

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLang, t } from "@/lib/i18n";

export default function ReachOut({
  profileId,
  profileName,
  ownerUserId,
}: {
  profileId: number;
  profileName: string;
  ownerUserId: string | null;
}) {
  const { lang } = useLang();
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [sparks, setSparks] = useState<string[]>([]);
  const [sparksTried, setSparksTried] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setViewerId(data.user?.id ?? null);
    });
  }, []);

  // no button on samples, your own profile, or when logged out
  if (!ownerUserId || !viewerId || viewerId === ownerUserId) return null;

  async function fetchSparks() {
    if (sparksTried) return;
    setSparksTried(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const r = await fetch("/api/spark", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sess.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ profileId, lang }),
      });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data.sparks)) setSparks(data.sparks);
      }
    } catch {
      // silent — plain box works fine without sparks
    }
  }

  async function send() {
    if (text.trim().length < 10) {
      setMsg(t(lang, "reach.short"));
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const r = await fetch("/api/reach-out", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sess.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ profileId, message: text.trim() }),
      });
      const data = await r.json();
      if (!r.ok) {
        setMsg(data.error || t(lang, "reach.failed"));
      } else {
        setDone(true);
        setOpen(false);
        setText("");
      }
    } catch {
      setMsg(t(lang, "reach.failed"));
    }
    setBusy(false);
  }

  const first = profileName.split(" ")[0];

  return (
    <div className="rise mt-4" style={{ animationDelay: "120ms" }}>
      {done ? (
        <div className="bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-2xl px-4 py-3">
          <p className="text-[14px] font-medium">
            {t(lang, "reach.sent", { name: first })}
          </p>
        </div>
      ) : !open ? (
        <button
          onClick={() => {
            setOpen(true);
            fetchSparks();
          }}
          className="w-full py-3 rounded-2xl border-[3px] border-[#1c1410] bg-[#c8f000] font-bold text-[15px] shadow-[5px_5px_0_#1c1410] hover:translate-y-[-2px] hover:shadow-[7px_8px_0_#1c1410] active:translate-y-0 active:shadow-[3px_3px_0_#1c1410] transition-all"
        >
          {t(lang, "reach.button")} {first}
        </button>
      ) : (
        <div className="bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-2xl p-4">
          <p className="text-[13px] mb-2 text-[#6b5e52]">
            {t(lang, "reach.explain", { name: first })}
          </p>
          {sparks.length > 0 && (
            <div className="mb-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b5e52] mb-1.5">
                {t(lang, "reach.sparks")}
              </p>
              <div className="flex flex-col gap-1.5">
                {sparks.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setText(s)}
                    className="text-left px-3 py-2 rounded-xl border-2 border-dashed border-[#6b4eff]/50 bg-white text-[13px] leading-snug hover:border-[#6b4eff] hover:bg-[#6b4eff]/5 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder={t(lang, "reach.placeholder", { name: first })}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#1c1410] bg-white outline-none focus:border-[#6b4eff] text-[14px]"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={send}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-sm disabled:opacity-50"
            >
              {busy ? t(lang, "reach.sending") : t(lang, "reach.send")}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setMsg(null);
              }}
              className="px-4 py-2.5 rounded-xl border-2 border-[#1c1410] bg-white font-bold text-sm"
            >
              {t(lang, "reach.cancel")}
            </button>
          </div>
          {msg && (
            <p className="mt-2 text-[13px] text-[#b03a3a] font-medium">{msg}</p>
          )}
        </div>
      )}
    </div>
  );
}
