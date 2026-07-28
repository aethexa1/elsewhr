"use client";

// elsewhr — reach out: a knock, not a DM. Nothing lands without consent.
// Replaces app/p/[id]/ReachOut.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useLang, t } from "@/lib/i18n";

// when the AI sparks don't arrive, nobody faces a blank box — three human openers stand ready
const OPENERS: Record<string, string[]> = {
  en: ["arriving around the same time — hi 👋", "saw we're into some of the same things", "new here too. figured I'd say hi first"],
  es: ["llegamos por las mismas fechas — hola 👋", "vi que nos gustan cosas parecidas", "también soy nuevo aquí. quería saludar primero"],
  pt: ["chegando na mesma época — oi 👋", "vi que curtimos coisas parecidas", "também sou novo aqui. resolvi dizer oi primeiro"],
  hi: ["लगभग साथ ही पहुँच रहे हैं — hi 👋", "देखा हम कुछ एक जैसी चीज़ें पसंद करते हैं", "मैं भी यहाँ नया हूँ। सोचा पहले hi बोल दूँ"],
  pl: ["przyjeżdżamy w podobnym czasie — cześć 👋", "widzę, że lubimy podobne rzeczy", "też jestem tu nowy. pomyślałem, że się przywitam"],
  fr: ["on arrive à peu près en même temps — salut 👋", "j'ai vu qu'on aime des trucs similaires", "nouveau ici aussi. je me lance en premier"],
};

const WAVE_STRINGS: Record<string, { wave: string; waved: string }> = {
  en: { wave: "👋 wave", waved: "👋 wave sent — zero words needed" },
  es: { wave: "👋 saludar", waved: "👋 saludo enviado — sin palabras" },
  pt: { wave: "👋 acenar", waved: "👋 aceno enviado — sem palavras" },
  hi: { wave: "👋 wave", waved: "👋 wave भेज दिया — शब्दों की ज़रूरत नहीं" },
  pl: { wave: "👋 pomachaj", waved: "👋 machnięcie wysłane — bez słów" },
  fr: { wave: "👋 saluer", waved: "👋 salut envoyé — zéro mot" },
};

const CONSENT_STRINGS: Record<string, { explain: string; sent: string }> = {
  en: {
    explain: "this arrives as a knock, not a DM — {name} chooses to accept it. addresses stay private.",
    sent: "your knock is with {name}. if they accept, your message lands in their inbox.",
  },
  es: {
    explain: "esto llega como una solicitud, no un DM — {name} decide aceptarla. las direcciones quedan privadas.",
    sent: "tu solicitud llegó a {name}. si acepta, tu mensaje aterriza en su correo.",
  },
  pt: {
    explain: "isso chega como um pedido, não uma DM — {name} decide aceitar. os endereços ficam privados.",
    sent: "seu pedido chegou a {name}. se aceitar, sua mensagem cai na caixa de entrada.",
  },
  hi: {
    explain: "यह एक अनुरोध की तरह पहुँचता है, DM नहीं — {name} इसे स्वीकार करना चुनते हैं। ईमेल पते निजी रहते हैं।",
    sent: "आपकी दस्तक {name} तक पहुँच गई। अगर वे स्वीकार करते हैं, तो आपका संदेश उनके इनबॉक्स में पहुँचेगा।",
  },
  pl: {
    explain: "to dociera jako prośba, nie DM — {name} decyduje, czy przyjąć. adresy pozostają prywatne.",
    sent: "twoje pukanie dotarło do {name}. jeśli zaakceptuje, wiadomość trafi do skrzynki.",
  },
  fr: {
    explain: "ça arrive comme une demande, pas un DM — {name} choisit d'accepter. les adresses restent privées.",
    sent: "ta demande est chez {name}. s'il accepte, ton message arrive dans sa boîte.",
  },
};

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
  const router = useRouter();
  const cs = CONSENT_STRINGS[lang] || CONSENT_STRINGS.en;
  const ws = WAVE_STRINGS[lang] || WAVE_STRINGS.en;
  const openers = OPENERS[lang] || OPENERS.en;
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

  async function sendWave() {
    if (busy) return;
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
        body: JSON.stringify({ profileId, message: "👋" }),
      });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        const tid = (d as { id?: number }).id;
        if (tid) { router.push("/t/" + tid); return; }
        setDone(true);
        setMsg(null);
      } else {
        const d = await r.json().catch(() => ({}));
        setMsg((d as { error?: string }).error || "something slipped — try again");
      }
    } catch {
      setMsg("something slipped — try again");
    }
    setBusy(false);
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
        const tid = (data as { id?: number }).id;
        if (tid) { router.push("/t/" + tid); return; }
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
            {cs.sent.replace("{name}", first)} 🐦
          </p>
        </div>
      ) : !open ? (
        <div className="flex gap-2">
          <button
            onClick={async () => {
              // an existing thread is THE thread — walk in instead of knocking again
              try {
                const { data: userData } = await supabase.auth.getUser();
                const uid = userData?.user?.id;
                if (uid) {
                  const { data: pair } = await supabase
                    .from("reach_requests")
                    .select("id")
                    .in("status", ["pending", "accepted"])
                    .or(`and(sender_user_id.eq.${uid},recipient_profile_id.eq.${profileId}),and(recipient_user_id.eq.${uid},sender_profile_id.eq.${profileId})`)
                    .order("id", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                  if (pair?.id) { router.push("/t/" + pair.id); return; }
                }
              } catch { /* fall through to compose */ }
              setOpen(true);
              fetchSparks();
            }}
            className="flex-1 py-3 rounded-2xl border-[3px] border-[#1c1410] bg-[#c8f000] font-bold text-[15px] shadow-[5px_5px_0_#1c1410] hover:translate-y-[-2px] hover:shadow-[7px_8px_0_#1c1410] active:translate-y-0 active:shadow-[3px_3px_0_#1c1410] transition-all"
          >
            {t(lang, "reach.button")} {first}
          </button>
          <button
            onClick={sendWave}
            disabled={busy}
            className="px-4 py-3 rounded-2xl border-[3px] border-[#1c1410] bg-white font-bold text-[15px] shadow-[5px_5px_0_#1c1410] hover:bg-[#c8f000] hover:translate-y-[-2px] hover:shadow-[7px_8px_0_#1c1410] transition-all disabled:opacity-50"
            title={ws.waved}
          >
            {ws.wave}
          </button>
        </div>
      ) : (
        <div className="bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-2xl p-4">
          <p className="text-[13px] mb-2 text-[#6b5e52]">
            {cs.explain.replace("{name}", first)}
          </p>
          {sparks.length === 0 && sparksTried && (
            <div className="mb-3 flex flex-col gap-1.5">
              {openers.map((o) => (
                <button key={o} type="button" onClick={() => setText(o)}
                  className="text-left px-3 py-2 rounded-xl border-2 border-dashed border-[#6b4eff]/50 bg-white text-[13px] leading-snug hover:border-[#6b4eff] hover:bg-[#6b4eff]/5 transition-colors"
                >
                  {o}
                </button>
              ))}
            </div>
          )}
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
