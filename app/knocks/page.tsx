"use client";

// elsewhr — knocks at your door: the in-app inbox for reach-out requests
// New file: app/knocks/page.tsx
// Works even when email can't deliver — the door lives here now.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";

type Knock = {
  id: number;
  sender_profile_id: number;
  message: string;
  status: string;
  created_at: string;
  accept_token: string;
};

type SenderCard = {
  id: number;
  name: string;
  headline: string;
  photo?: string | null;
  accent?: string | null;
};

const STRINGS: Record<string, {
  title: string; sub: string; empty: string; loading: string;
  accept: string; ignore: string; accepted: string; acceptedNoEmail: string; openChat: string; sentThreads: string; waiting: string;
  ignored: string; wantsTo: string; seeWork: string; back: string;
}> = {
  en: {
    title: "knocks at your door",
    sub: "people who want to reach you. accept to open the thread — ignore and they'll never know.",
    empty: "no knocks right now. the door is quiet.",
    loading: "checking the door…",
    accept: "accept — open the thread",
    ignore: "ignore",
    accepted: "thread open — their message is in your email, just hit reply.",
    acceptedNoEmail: "accepted — their message is saved here. the email thread opens once elsewhr's mail is fully set up.",
    openChat: "open chat →",
    sentThreads: "your open threads",
    waiting: "waiting on them — they’ll see it in their knocks",
    ignored: "ignored. they were never told.",
    wantsTo: "wants to reach out:",
    seeWork: "see their real work →",
    back: "← back to elsewhr",
  },
  es: {
    title: "llamados a tu puerta",
    sub: "gente que quiere contactarte. acepta para abrir el hilo — ignora y nunca lo sabrán.",
    empty: "no hay llamados ahora. la puerta está tranquila.",
    loading: "revisando la puerta…",
    accept: "aceptar — abrir el hilo",
    ignore: "ignorar",
    accepted: "hilo abierto — su mensaje está en tu correo, solo responde.",
    acceptedNoEmail: "aceptado — su mensaje quedó guardado aquí. el hilo por correo se abre cuando el mail de elsewhr esté listo.",
    openChat: "abrir chat →",
    sentThreads: "tus hilos abiertos",
    waiting: "esperando su respuesta — lo verán en sus knocks",
    ignored: "ignorado. nunca lo sabrán.",
    wantsTo: "quiere contactarte:",
    seeWork: "ver su trabajo real →",
    back: "← volver a elsewhr",
  },
  pt: {
    title: "batidas na sua porta",
    sub: "pessoas que querem falar com você. aceite para abrir o fio — ignore e elas nunca saberão.",
    empty: "nenhuma batida agora. a porta está quieta.",
    loading: "verificando a porta…",
    accept: "aceitar — abrir o fio",
    ignore: "ignorar",
    accepted: "fio aberto — a mensagem está no seu e-mail, é só responder.",
    acceptedNoEmail: "aceito — a mensagem ficou salva aqui. o fio por e-mail abre quando o mail do elsewhr estiver pronto.",
    openChat: "abrir chat →",
    sentThreads: "seus fios abertos",
    waiting: "esperando resposta — vão ver nos knocks deles",
    ignored: "ignorado. nunca saberão.",
    wantsTo: "quer falar com você:",
    seeWork: "ver o trabalho real →",
    back: "← voltar ao elsewhr",
  },
  hi: {
    title: "आपके दरवाज़े पर दस्तक",
    sub: "लोग जो आपसे जुड़ना चाहते हैं। स्वीकार करें और बातचीत शुरू करें — नज़रअंदाज़ करें तो उन्हें कभी पता नहीं चलेगा।",
    empty: "अभी कोई दस्तक नहीं। दरवाज़ा शांत है।",
    loading: "दरवाज़ा देख रहे हैं…",
    accept: "स्वीकार करें — बातचीत खोलें",
    ignore: "नज़रअंदाज़ करें",
    accepted: "बातचीत खुल गई — उनका संदेश आपके ईमेल में है, बस reply करें।",
    acceptedNoEmail: "स्वीकार किया — संदेश यहाँ सुरक्षित है। elsewhr का मेल तैयार होते ही ईमेल थ्रेड खुलेगा।",
    openChat: "चैट खोलो →",
    sentThreads: "आपकी खुली बातचीत",
    waiting: "उनके जवाब का इंतज़ार — उनके knocks में दिखेगा",
    ignored: "नज़रअंदाज़ किया। उन्हें कभी पता नहीं चलेगा।",
    wantsTo: "आपसे जुड़ना चाहते हैं:",
    seeWork: "उनका असली काम देखें →",
    back: "← elsewhr पर वापस",
  },
  pl: {
    title: "pukanie do twoich drzwi",
    sub: "ludzie, którzy chcą się z tobą skontaktować. zaakceptuj, by otworzyć wątek — zignoruj, a nigdy się nie dowiedzą.",
    empty: "brak pukania. drzwi są spokojne.",
    loading: "sprawdzam drzwi…",
    accept: "akceptuj — otwórz wątek",
    ignore: "ignoruj",
    accepted: "wątek otwarty — wiadomość jest w twoim mailu, po prostu odpowiedz.",
    acceptedNoEmail: "zaakceptowano — wiadomość zapisana tutaj. wątek mailowy otworzy się, gdy poczta elsewhr będzie gotowa.",
    openChat: "otwórz czat →",
    sentThreads: "twoje otwarte wątki",
    waiting: "czekamy na nich — zobaczą to w swoich knocks",
    ignored: "zignorowano. nigdy się nie dowiedzą.",
    wantsTo: "chce się skontaktować:",
    seeWork: "zobacz prawdziwą pracę →",
    back: "← wróć do elsewhr",
  },
  fr: {
    title: "on frappe à ta porte",
    sub: "des gens veulent te joindre. accepte pour ouvrir le fil — ignore et ils ne le sauront jamais.",
    empty: "personne ne frappe. la porte est calme.",
    loading: "on vérifie la porte…",
    accept: "accepter — ouvrir le fil",
    ignore: "ignorer",
    accepted: "fil ouvert — leur message est dans ta boîte mail, réponds simplement.",
    acceptedNoEmail: "accepté — le message est gardé ici. le fil par e-mail s'ouvrira quand le mail d'elsewhr sera prêt.",
    openChat: "ouvrir le chat →",
    sentThreads: "tes fils ouverts",
    waiting: "en attente — ils le verront dans leurs knocks",
    ignored: "ignoré. ils ne le sauront jamais.",
    wantsTo: "veut te joindre :",
    seeWork: "voir son vrai travail →",
    back: "← retour à elsewhr",
  },
};

export default function KnocksPage() {
  const { lang } = useLang();
  const s = STRINGS[lang] || STRINGS.en;
  const [loading, setLoading] = useState(true);
  const [knocks, setKnocks] = useState<Knock[]>([]);
  const [threads, setThreads] = useState<{ id: number; other: SenderCard | null }[]>([]);
  const [outgoing, setOutgoing] = useState<{ id: number; other: SenderCard | null; isWave: boolean }[]>([]);
  const [senders, setSenders] = useState<Record<number, SenderCard>>({});
  const [done, setDone] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        try { localStorage.setItem("wh_msgs_seen", new Date().toISOString()); } catch { /* fine */ }
      setLoading(false);
        return;
      }
      const { data: rows } = await supabase
        .from("reach_requests")
        .select("id, sender_profile_id, message, status, created_at, accept_token")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      const list = (rows ?? []) as Knock[];
      setKnocks(list);

      // open threads: accepted knocks in either direction become chats
      const uid = auth.user.id;
      const { data: acc } = await supabase
        .from("reach_requests")
        .select("id, sender_user_id, sender_profile_id, recipient_profile_id, recipient_user_id")
        .in("status", ["pending", "accepted"])
        .or(`sender_user_id.eq.${uid},recipient_user_id.eq.${uid}`)
        .order("id", { ascending: false })
        .limit(30);
      // in flight: my pending knocks and waves, so silence never reads as failure
      const { data: outg } = await supabase
        .from("reach_requests")
        .select("id, recipient_profile_id, message")
        .eq("status", "pending")
        .eq("sender_user_id", uid)
        .order("id", { ascending: false })
        .limit(20);
      type OutRow = { id: number; recipient_profile_id: number; message: string };
      if (outg && outg.length > 0) {
        const outRows = outg as OutRow[];
        const outIds = [...new Set(outRows.map((r) => r.recipient_profile_id))];
        const { data: outPpl } = await supabase.from("profiles").select("id, name, headline, photo, accent").in("id", outIds);
        const outBy: Record<number, SenderCard> = {};
        for (const p of (outPpl ?? []) as SenderCard[]) outBy[p.id] = p;
        setOutgoing(outRows.map((r) => ({ id: r.id, other: outBy[r.recipient_profile_id] ?? null, isWave: r.message.trim() === "👋" })));
      }

      type AccRow = { id: number; sender_user_id: string; sender_profile_id: number; recipient_profile_id: number };
      if (acc && acc.length > 0) {
        const rowsA = acc as AccRow[];
        const otherIds = [...new Set(rowsA.map((r) => (r.sender_user_id === uid ? r.recipient_profile_id : r.sender_profile_id)))];
        const { data: ppl } = await supabase.from("profiles").select("id, name, headline, photo, accent").in("id", otherIds);
        const byId: Record<number, SenderCard> = {};
        for (const p of (ppl ?? []) as SenderCard[]) byId[p.id] = p;
        setThreads(rowsA.map((r) => ({ id: r.id, other: byId[r.sender_user_id === uid ? r.recipient_profile_id : r.sender_profile_id] ?? null })));
      }
      if (list.length > 0) {
        const ids = [...new Set(list.map((k) => k.sender_profile_id))];
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, name, headline, photo, accent")
          .in("id", ids);
        const map: Record<number, SenderCard> = {};
        for (const p of (profs ?? []) as SenderCard[]) map[p.id] = p;
        setSenders(map);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function act(k: Knock, action: "accept" | "ignore") {
    if (busy !== null) return;
    setBusy(k.id);
    try {
      const r = await fetch("/api/knock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: k.accept_token, action }),
      });
      const data = await r.json();
      if (r.ok && data.ok) {
        if (action === "ignore") setDone((d) => ({ ...d, [k.id]: s.ignored }));
        else setDone((d) => ({ ...d, [k.id]: data.emailed ? s.accepted : s.acceptedNoEmail }));
      }
    } catch {
      // leave the card; they can retry
    }
    setBusy(null);
  }

  return (
    <main className="relative min-h-screen bg-[#ff5d3b] text-[#1c1410] flex justify-center px-4 py-8 overflow-hidden">
      <style>{`
        @keyframes rise { from { opacity:0; transform:translateY(22px);} to { opacity:1; transform:none;} }
        .rise { animation: rise .5s cubic-bezier(.2,.7,.3,1) both; }
        @media (prefers-reduced-motion: reduce) { .rise { animation:none !important; } }
      `}</style>
      <div className="relative w-full max-w-[560px]">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">
            elsewhr<span className="text-[#c8f000]">.</span>
          </Link>
          <Link href="/" className="font-mono text-[11px] text-[#fff6ec]/80 underline underline-offset-4 hover:text-[#fff6ec]">
            {s.back}
          </Link>
        </div>

        <h1 className="rise font-[Syne] font-extrabold text-3xl text-[#fff6ec]">{s.title}</h1>
        <p className="rise mt-2 mb-6 text-[14px] text-[#fff6ec]/90 leading-snug" style={{ animationDelay: "80ms" }}>
          {s.sub}
        </p>

        {loading && <p className="font-mono text-[12px] text-[#fff6ec]/70">{s.loading}</p>}

        {!loading && knocks.length === 0 && (
          <div className="rise bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl p-8 text-center shadow-[7px_7px_0_#1c1410]">
            <p className="text-[15px] font-medium">{s.empty} 🐦</p>
          </div>
        )}

        {threads.length > 0 && (
          <div className="mb-8">
            <p className="font-mono text-[11px] uppercase tracking-widest text-[#fff6ec]/70 mb-3">💬 {s.sentThreads}</p>
            <div className="flex flex-col gap-2.5">
              {threads.map((t) => (
                <Link key={t.id} href={"/t/" + t.id}
                  className="flex items-center gap-3 bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-2xl px-4 py-3 shadow-[5px_5px_0_rgba(28,20,16,0.9)] hover:translate-y-[-2px] transition-transform"
                >
                  {t.other?.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.other.photo} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-[#1c1410]" />
                  ) : (
                    <div className="w-10 h-10 rounded-full border-2 border-[#1c1410] flex items-center justify-center font-bold text-white" style={{ background: t.other?.accent || "#6b4eff" }}>
                      {(t.other?.name || "?").slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-[Syne] font-extrabold text-[15px] leading-tight truncate">{t.other?.name ?? "…"}</p>
                    {t.other?.headline && <p className="text-[11.5px] text-[#6b5e52] truncate">{t.other.headline}</p>}
                  </div>
                  <span className="text-[18px]">💬</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {outgoing.length > 0 && (
          <div className="mb-8">
            <p className="font-mono text-[11px] uppercase tracking-widest text-[#fff6ec]/70 mb-3">🕐 {s.waiting}</p>
            <div className="flex flex-wrap gap-2">
              {outgoing.map((o) => (
                <span key={o.id} className="flex items-center gap-2 bg-[#fff6ec]/15 border-2 border-[#fff6ec]/40 rounded-full pl-1.5 pr-3.5 py-1.5">
                  {o.other?.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.other.photo} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-[#1c1410]" />
                  ) : (
                    <span className="w-7 h-7 rounded-full border-2 border-[#1c1410] flex items-center justify-center text-[11px] font-bold text-white" style={{ background: o.other?.accent || "#6b4eff" }}>
                      {(o.other?.name || "?").slice(0, 1)}
                    </span>
                  )}
                  <span className="text-[12.5px] font-bold text-[#fff6ec]">{o.other?.name ?? "…"}{o.isWave ? " 👋" : ""}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {knocks.map((k, idx) => {
            const sender = senders[k.sender_profile_id];
            const accent = sender?.accent || "#6b4eff";
            const resolved = done[k.id];
            return (
              <div
                key={k.id}
                className="rise bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl overflow-hidden shadow-[7px_7px_0_#1c1410]"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <div style={{ background: accent }} className="h-2 w-full" />
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    {sender?.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sender.photo} alt={sender.name} className="w-12 h-12 rounded-full object-cover border-[3px] flex-none" style={{ borderColor: accent }} />
                    ) : (
                      <div className="w-12 h-12 rounded-full text-[#fff6ec] flex items-center justify-center font-[Syne] font-extrabold text-xl flex-none" style={{ background: accent }}>
                        {sender?.name?.[0] ?? "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-[Syne] font-extrabold text-lg leading-tight truncate">
                        {sender?.name ?? "…"} <span className="font-sans font-medium text-[13px] text-[#6b5e52]">{s.wantsTo}</span>
                      </p>
                      {sender?.headline && (
                        <p className="text-[12.5px] text-[#6b5e52] truncate">{sender.headline}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 bg-white border-2 border-[#1c1410] rounded-xl p-3 text-[14px] leading-relaxed whitespace-pre-wrap">
                    {k.message}
                  </div>

                  {sender && (
                    <p className="mt-2">
                      <Link href={`/p/${sender.id}`} className="font-mono text-[11.5px] font-bold text-[#6b4eff] underline underline-offset-4">
                        {s.seeWork}
                      </Link>
                    </p>
                  )}

                  {resolved ? (
                    <div>
                      <p className="mt-4 text-[13.5px] font-medium">{resolved} 🐦</p>
                      <Link href={"/t/" + k.id} className="inline-block mt-2 px-4 py-2 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-[13px]">
                        💬 {s.openChat}
                      </Link>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => act(k, "accept")}
                        disabled={busy !== null}
                        className="flex-1 py-2.5 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-[14px] hover:translate-y-[-2px] transition-transform disabled:opacity-50"
                      >
                        {s.accept}
                      </button>
                      <button
                        type="button"
                        onClick={() => act(k, "ignore")}
                        disabled={busy !== null}
                        className="px-4 py-2.5 rounded-xl border-2 border-[#1c1410] bg-white font-bold text-[14px] disabled:opacity-50"
                      >
                        {s.ignore}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
