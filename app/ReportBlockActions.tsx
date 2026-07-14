"use client";

// elsewhr — report + block actions for a profile
// New file: app/ReportBlockActions.tsx
// Self-contained: strings for all six languages live in this file.
// Renders nothing for guests and nothing on your own profile.

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";

type RBStrings = {
  report: string;
  block: string;
  unblock: string;
  blockedNote: string;
  modalTitle: string;
  reasons: { key: string; label: string }[];
  detailsPlaceholder: string;
  send: string;
  cancel: string;
  thanks: string;
  confirmBlock: string;
};

const STRINGS: Record<string, RBStrings> = {
  en: {
    report: "report",
    block: "block",
    unblock: "unblock",
    blockedNote: "blocked — they no longer appear in your feed.",
    modalTitle: "what's wrong with this profile?",
    reasons: [
      { key: "fake", label: "it's fake" },
      { key: "spam", label: "spam" },
      { key: "harassment", label: "harassment" },
      { key: "inappropriate", label: "inappropriate" },
      { key: "other", label: "something else" },
    ],
    detailsPlaceholder: "anything we should know (optional)",
    send: "send report",
    cancel: "cancel",
    thanks: "got it. we take these seriously — thank you.",
    confirmBlock: "block this person? they'll disappear from your feed and can't reach you.",
  },
  es: {
    report: "reportar",
    block: "bloquear",
    unblock: "desbloquear",
    blockedNote: "bloqueado — ya no aparece en tu feed.",
    modalTitle: "¿qué pasa con este perfil?",
    reasons: [
      { key: "fake", label: "es falso" },
      { key: "spam", label: "spam" },
      { key: "harassment", label: "acoso" },
      { key: "inappropriate", label: "inapropiado" },
      { key: "other", label: "otra cosa" },
    ],
    detailsPlaceholder: "algo que debamos saber (opcional)",
    send: "enviar reporte",
    cancel: "cancelar",
    thanks: "recibido. nos lo tomamos en serio — gracias.",
    confirmBlock: "¿bloquear a esta persona? desaparecerá de tu feed y no podrá contactarte.",
  },
  pt: {
    report: "denunciar",
    block: "bloquear",
    unblock: "desbloquear",
    blockedNote: "bloqueado — não aparece mais no seu feed.",
    modalTitle: "qual é o problema com este perfil?",
    reasons: [
      { key: "fake", label: "é falso" },
      { key: "spam", label: "spam" },
      { key: "harassment", label: "assédio" },
      { key: "inappropriate", label: "inapropriado" },
      { key: "other", label: "outra coisa" },
    ],
    detailsPlaceholder: "algo que devemos saber (opcional)",
    send: "enviar denúncia",
    cancel: "cancelar",
    thanks: "recebido. levamos isso a sério — obrigado.",
    confirmBlock: "bloquear esta pessoa? ela sumirá do seu feed e não poderá te contatar.",
  },
  hi: {
    report: "रिपोर्ट करें",
    block: "ब्लॉक करें",
    unblock: "अनब्लॉक करें",
    blockedNote: "ब्लॉक किया गया — अब आपकी फ़ीड में नहीं दिखेगा।",
    modalTitle: "इस प्रोफ़ाइल में क्या गड़बड़ है?",
    reasons: [
      { key: "fake", label: "यह नकली है" },
      { key: "spam", label: "स्पैम" },
      { key: "harassment", label: "उत्पीड़न" },
      { key: "inappropriate", label: "अनुचित" },
      { key: "other", label: "कुछ और" },
    ],
    detailsPlaceholder: "कुछ और जो हमें पता होना चाहिए (वैकल्पिक)",
    send: "रिपोर्ट भेजें",
    cancel: "रद्द करें",
    thanks: "मिल गया। हम इसे गंभीरता से लेते हैं — धन्यवाद।",
    confirmBlock: "इस व्यक्ति को ब्लॉक करें? यह आपकी फ़ीड से हट जाएगा और आपसे संपर्क नहीं कर पाएगा।",
  },
  pl: {
    report: "zgłoś",
    block: "zablokuj",
    unblock: "odblokuj",
    blockedNote: "zablokowano — nie pojawia się już w twoim feedzie.",
    modalTitle: "co jest nie tak z tym profilem?",
    reasons: [
      { key: "fake", label: "jest fałszywy" },
      { key: "spam", label: "spam" },
      { key: "harassment", label: "nękanie" },
      { key: "inappropriate", label: "nieodpowiedni" },
      { key: "other", label: "coś innego" },
    ],
    detailsPlaceholder: "coś, co powinniśmy wiedzieć (opcjonalnie)",
    send: "wyślij zgłoszenie",
    cancel: "anuluj",
    thanks: "przyjęto. traktujemy to poważnie — dziękujemy.",
    confirmBlock: "zablokować tę osobę? zniknie z twojego feedu i nie będzie mogła się z tobą kontaktować.",
  },
  fr: {
    report: "signaler",
    block: "bloquer",
    unblock: "débloquer",
    blockedNote: "bloqué — il n'apparaît plus dans ton fil.",
    modalTitle: "quel est le problème avec ce profil ?",
    reasons: [
      { key: "fake", label: "c'est un faux" },
      { key: "spam", label: "spam" },
      { key: "harassment", label: "harcèlement" },
      { key: "inappropriate", label: "inapproprié" },
      { key: "other", label: "autre chose" },
    ],
    detailsPlaceholder: "quelque chose à savoir (facultatif)",
    send: "envoyer le signalement",
    cancel: "annuler",
    thanks: "bien reçu. nous prenons cela au sérieux — merci.",
    confirmBlock: "bloquer cette personne ? elle disparaîtra de ton fil et ne pourra plus te contacter.",
  },
};

export default function ReportBlockActions({
  profileId,
  profileOwnerId,
}: {
  profileId: number;
  profileOwnerId?: string | null;
}) {
  const { lang } = useLang();
  const s = STRINGS[lang] || STRINGS.en;

  const [uid, setUid] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUid(data.user.id);
      const { data: b } = await supabase
        .from("blocks")
        .select("blocked_profile_id")
        .eq("blocked_profile_id", profileId)
        .limit(1);
      if (b && b.length > 0) setBlocked(true);
    });
  }, [profileId]);

  // guests see nothing; you can't report or block yourself
  if (!uid) return null;
  if (profileOwnerId && profileOwnerId === uid) return null;

  const submitReport = async () => {
    if (!reason || busy) return;
    setBusy(true);
    const { error } = await supabase.from("reports").insert({
      reporter_user_id: uid,
      reported_profile_id: profileId,
      reason,
      details: details.trim() ? details.trim() : null,
    });
    setBusy(false);
    // duplicate report (unique index) still means "received"
    if (!error || error.code === "23505") {
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setReason(null);
        setDetails("");
      }, 1800);
    }
  };

  const toggleBlock = async () => {
    if (busy) return;
    if (!blocked) {
      const ok = window.confirm(s.confirmBlock);
      if (!ok) return;
      setBusy(true);
      const { error } = await supabase.from("blocks").insert({
        blocker_user_id: uid,
        blocked_profile_id: profileId,
      });
      setBusy(false);
      if (!error || error.code === "23505") setBlocked(true);
    } else {
      setBusy(true);
      const { error } = await supabase
        .from("blocks")
        .delete()
        .eq("blocker_user_id", uid)
        .eq("blocked_profile_id", profileId);
      setBusy(false);
      if (!error) setBlocked(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3 justify-end">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-mono text-[11.5px] tracking-wide text-[#6b5e52] underline underline-offset-4 hover:text-[#1c1410] transition-colors"
        >
          ⚑ {s.report}
        </button>
        <button
          type="button"
          onClick={toggleBlock}
          disabled={busy}
          className="font-mono text-[11.5px] tracking-wide text-[#6b5e52] underline underline-offset-4 hover:text-[#1c1410] transition-colors disabled:opacity-50"
        >
          ⊘ {blocked ? s.unblock : s.block}
        </button>
      </div>

      {blocked && (
        <p className="mt-2 text-right font-mono text-[11px] text-[#6b5e52]">{s.blockedNote}</p>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(28,20,16,0.55)" }} onClick={() => !busy && setOpen(false)}>
          <div className="w-full max-w-md bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl shadow-[8px_8px_0_#1c1410] p-6" onClick={(e) => e.stopPropagation()}>
            {sent ? (
              <p className="font-bold text-[15px] text-[#1c1410] text-center py-6">{s.thanks}</p>
            ) : (
              <>
                <p className="font-[Syne] font-extrabold text-lg text-[#1c1410] mb-4">{s.modalTitle}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {s.reasons.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setReason(r.key)}
                      className={
                        (reason === r.key
                          ? "bg-[#1c1410] text-[#fff6ec] "
                          : "bg-white text-[#1c1410] hover:bg-[#1c1410]/5 ") +
                        "px-3 py-1.5 rounded-full border-[2.5px] border-[#1c1410] font-mono text-[12px] font-bold transition-colors"
                      }
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={s.detailsPlaceholder}
                  rows={3}
                  maxLength={500}
                  className="w-full bg-white border-[2.5px] border-[#1c1410] rounded-2xl p-3 font-mono text-[12.5px] text-[#1c1410] placeholder:text-[#6b5e52] focus:outline-none mb-4 resize-none"
                />
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={busy}
                    className="px-4 py-2.5 rounded-2xl border-[2.5px] border-[#1c1410]/40 font-bold text-[13px] text-[#1c1410] hover:bg-[#1c1410]/5 transition-colors disabled:opacity-50"
                  >
                    {s.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={submitReport}
                    disabled={!reason || busy}
                    className="px-5 py-2.5 rounded-2xl bg-[#ff5d3b] text-[#fff6ec] font-bold text-[13px] border-[2.5px] border-[#1c1410] shadow-[4px_4px_0_#1c1410] hover:translate-y-[-2px] hover:shadow-[5px_6px_0_#1c1410] active:translate-y-0 active:shadow-[2px_2px_0_#1c1410] transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_#1c1410]"
                  >
                    {s.send}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
