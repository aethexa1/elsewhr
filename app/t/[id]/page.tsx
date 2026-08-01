"use client";

// elsewhr — the thread: chat that begins with consent.
// New file: app/t/[id]/page.tsx  ·  /t/{requestId}
// A thread exists only where a knock was accepted. The knock is message #1.

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";

type Req = {
  id: number;
  sender_user_id: string;
  sender_profile_id: number;
  recipient_profile_id: number;
  recipient_user_id: string;
  message: string;
  status: string;
  created_at: string;
};

type Msg = { id: number; sender_user_id: string; body: string; created_at: string };

type Mini = { id: number; name: string; photo?: string | null; accent?: string | null };

const SAFE: Record<string, { block: string; confirm: string; report: string }> = {
  en: { block: "block", confirm: "block this person? they vanish from your elsewhr, and can never message you again.", report: "report" },
  es: { block: "bloquear", confirm: "¿bloquear a esta persona? desaparece de tu elsewhr y no podrá escribirte nunca más.", report: "reportar" },
  pt: { block: "bloquear", confirm: "bloquear esta pessoa? ela some do seu elsewhr e nunca mais pode te escrever.", report: "denunciar" },
  hi: { block: "block", confirm: "इस व्यक्ति को block करें? वो आपके elsewhr से गायब हो जाएगा और कभी message नहीं कर पाएगा।", report: "report" },
  pl: { block: "zablokuj", confirm: "zablokować tę osobę? zniknie z twojego elsewhr i nigdy więcej nie napisze.", report: "zgłoś" },
  fr: { block: "bloquer", confirm: "bloquer cette personne ? elle disparaît de ton elsewhr et ne pourra plus jamais t'écrire.", report: "signaler" },
};

const STRINGS: Record<string, { ph: string; send: string; notFound: string; back: string; loading: string }> = {
  en: { ph: "say something…", send: "send", notFound: "this thread isn't yours or isn't open yet.", back: "← back to knocks", loading: "opening the thread…" },
  es: { ph: "di algo…", send: "enviar", notFound: "este hilo no es tuyo o aún no está abierto.", back: "← volver a knocks", loading: "abriendo el hilo…" },
  pt: { ph: "diga algo…", send: "enviar", notFound: "este fio não é seu ou ainda não está aberto.", back: "← voltar aos knocks", loading: "abrindo o fio…" },
  hi: { ph: "कुछ कहो…", send: "भेजो", notFound: "यह बातचीत आपकी नहीं है या अभी खुली नहीं है।", back: "← knocks पर वापस", loading: "बातचीत खुल रही है…" },
  pl: { ph: "powiedz coś…", send: "wyślij", notFound: "ten wątek nie jest twój albo nie jest jeszcze otwarty.", back: "← wróć do knocks", loading: "otwieram wątek…" },
  fr: { ph: "dis quelque chose…", send: "envoyer", notFound: "ce fil n'est pas à toi ou pas encore ouvert.", back: "← retour aux knocks", loading: "ouverture du fil…" },
};

function ThreadInner() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLang();
  const s = STRINGS[lang] || STRINGS.en;
  const sf = SAFE[lang] || SAFE.en;
  const requestId = Number(params?.id);

  const [me, setMe] = useState<string | null>(null);
  const [req, setReq] = useState<Req | null>(null);
  const [other, setOther] = useState<Mini | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const endRef = useRef<HTMLDivElement | null>(null);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("id, sender_user_id, body, created_at")
      .eq("request_id", requestId)
      .order("id", { ascending: true })
      .limit(200);
    if (data) setMsgs(data as Msg[]);
  }, [requestId]);

  useEffect(() => {
    if (!Number.isFinite(requestId)) { setState("denied"); return; }
    let alive = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id ?? null;
      if (!uid) { router.push("/login"); return; }
      if (alive) setMe(uid);

      const { data: r } = await supabase
        .from("reach_requests")
        .select("id, sender_user_id, sender_profile_id, recipient_profile_id, recipient_user_id, message, status, created_at")
        .eq("id", requestId)
        .maybeSingle();
      if (!alive) return;
      if (!r || !["pending", "accepted"].includes((r as Req).status) || ((r as Req).sender_user_id !== uid && (r as Req).recipient_user_id !== uid)) {
        setState("denied");
        return;
      }
      const rq = r as Req;
      setReq(rq);
      const otherProfileId = rq.sender_user_id === uid ? rq.recipient_profile_id : rq.sender_profile_id;
      const { data: p } = await supabase
        .from("profiles")
        .select("id, name, photo, accent")
        .eq("id", otherProfileId)
        .maybeSingle();
      if (alive && p) setOther(p as Mini);
      await loadMessages();
      if (alive) setState("ok");
    })();
    return () => { alive = false; };
  }, [requestId, router, loadMessages]);

  // gentle polling keeps the thread fresh without realtime plumbing
  useEffect(() => {
    if (state !== "ok") return;
    const id = window.setInterval(loadMessages, 4000);
    return () => window.clearInterval(id);
  }, [state, loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, state]);

  async function send() {
    const body = text.trim();
    if (!body || busy || !me) return;
    setBusy(true);
    setText("");
    setSendErr(null);
    const { data, error } = await supabase
      .from("messages")
      .insert({ request_id: requestId, sender_user_id: me, body })
      .select()
      .single();
    if (!error && data) {
      setMsgs((cur) => [...cur, data as Msg]);
      // replying IS accepting: the recipient's first message opens the thread for good
      if (req && req.status === "pending" && req.recipient_user_id === me) {
        await supabase.from("reach_requests").update({ status: "accepted" }).eq("id", requestId);
        setReq({ ...req, status: "accepted" });
      }
    }
    else {
      setText(body); // give their words back
      setSendErr("couldn't send — if this keeps happening, tell the 🐦 in the corner");
    }
    setBusy(false);
  }

  if (state === "loading") {
    return (
      <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex items-center justify-center">
        <p className="font-mono text-[13px] text-[#fff6ec]/80">{s.loading}</p>
      </main>
    );
  }
  if (state === "denied" || !req) {
    return (
      <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-[#fff6ec] text-[15px] text-center">{s.notFound}</p>
        <Link href="/knocks" className="font-mono text-[12px] font-bold text-[#fff6ec] underline underline-offset-4">{s.back}</Link>
      </main>
    );
  }

  const bubbles: Msg[] = [
    { id: 0, sender_user_id: req.sender_user_id, body: req.message, created_at: req.created_at },
    ...msgs,
  ];

  return (
    <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex justify-center px-4 py-6">
      <div className="w-full max-w-[560px] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <Link href="/knocks" className="font-mono text-[11px] text-[#fff6ec]/80 underline underline-offset-4 hover:text-[#fff6ec]">
            {s.back}
          </Link>
          {other && (
            <div className="flex items-center gap-3">
              <Link href={"/p/" + other.id} className="font-mono text-[10.5px] text-[#fff6ec]/70 underline underline-offset-2 hover:text-[#fff6ec]">
                ⚑ {sf.report}
              </Link>
              <button
                type="button"
                onClick={async () => {
                  if (!me || !other) return;
                  if (!window.confirm(sf.confirm)) return;
                  await supabase.from("blocks").insert({ blocker_user_id: me, blocked_profile_id: other.id });
                  router.push("/");
                }}
                className="font-mono text-[10.5px] font-bold text-[#fff6ec]/70 underline underline-offset-2 hover:text-[#fff6ec]"
              >
                🚫 {sf.block}
              </button>
            <Link href={"/p/" + other.id} className="flex items-center gap-2">
              {other.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={other.photo} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-[#1c1410]" />
              ) : (
                <div className="w-9 h-9 rounded-full border-2 border-[#1c1410] flex items-center justify-center font-bold text-white" style={{ background: other.accent || "#6b4eff" }}>
                  {(other.name || "?").slice(0, 1)}
                </div>
              )}
              <span className="font-[Syne] font-extrabold text-[16px] text-[#fff6ec]">{other.name}</span>
            </Link>
            </div>
          )}
        </div>

        <div className="flex-1 bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl shadow-[8px_8px_0_rgba(28,20,16,0.9)] p-4 flex flex-col gap-2 overflow-y-auto" style={{ minHeight: "55vh", maxHeight: "70vh" }}>
          {bubbles.map((m) => {
            const mine = m.sender_user_id === me;
            return (
              <div
                key={m.id + "-" + m.created_at}
                className={
                  mine
                    ? "self-end max-w-[85%] bg-[#6b4eff] text-white rounded-2xl rounded-br-md px-3.5 py-2.5 text-[14px] leading-snug"
                    : "self-start max-w-[85%] bg-white text-[#1c1410] border-2 border-[#1c1410] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[14px] leading-snug"
                }
              >
                {m.body}
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {sendErr && (
          <p className="mt-2 text-center font-mono text-[11.5px] text-[#fff6ec] bg-[#1c1410]/40 rounded-full px-3 py-1.5">{sendErr}</p>
        )}
        <div className="mt-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder={s.ph}
            maxLength={2000}
            className="flex-1 min-w-0 px-4 py-3 rounded-2xl border-[3px] border-[#1c1410] bg-[#fff6ec] text-[#1c1410] placeholder-[#6b5e52]/70 outline-none focus:border-[#6b4eff] text-[14.5px] shadow-[5px_5px_0_rgba(28,20,16,0.9)]"
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || !text.trim()}
            className="px-5 py-3 rounded-2xl border-[3px] border-[#1c1410] bg-[#c8f000] font-bold text-[14px] shadow-[5px_5px_0_rgba(28,20,16,0.9)] disabled:opacity-40"
          >
            {s.send} 🐦
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ThreadPage() {
  return (
    <Suspense fallback={null}>
      <ThreadInner />
    </Suspense>
  );
}
