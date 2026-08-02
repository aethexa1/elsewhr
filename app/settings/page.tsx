"use client";

// elsewhr — account settings: change email / change password
// Create this file at: app/settings/page.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n";

const T: Record<string, {
  emailTitle: string; newEmail: string; emailPh: string; sendBtn: string; sending: string;
  badEmail: string; sameEmail: string; emailSent: string;
  pwTitle: string; newPw: string; pwPh: string; confirmPw: string; confirmPh: string;
  saveBtn: string; saving: string; shortPw: string; mismatch: string; pwDone: string;
}> = {
  en: { emailTitle: "Change email", newEmail: "New email", emailPh: "new@example.com", sendBtn: "Update email →", sending: "Sending…", badEmail: "Enter a valid new email address.", sameEmail: "That's already your email.", emailSent: "Confirmation links sent. Check BOTH inboxes — your current email and the new one — and click both links to complete the change.", pwTitle: "Change password", newPw: "New password", pwPh: "At least 8 characters", confirmPw: "Confirm new password", confirmPh: "Same password again", saveBtn: "Update password →", saving: "Saving…", shortPw: "Password needs at least 8 characters.", mismatch: "Passwords don't match.", pwDone: "Password updated." },
  es: { emailTitle: "Cambiar email", newEmail: "Nuevo email", emailPh: "nuevo@ejemplo.com", sendBtn: "Actualizar email →", sending: "Enviando…", badEmail: "Escribe un email nuevo válido.", sameEmail: "Ese ya es tu email.", emailSent: "Enlaces de confirmación enviados. Revisa AMBAS bandejas — tu email actual y el nuevo — y haz clic en ambos enlaces.", pwTitle: "Cambiar contraseña", newPw: "Nueva contraseña", pwPh: "Mínimo 8 caracteres", confirmPw: "Confirma la contraseña", confirmPh: "La misma otra vez", saveBtn: "Actualizar contraseña →", saving: "Guardando…", shortPw: "La contraseña necesita al menos 8 caracteres.", mismatch: "Las contraseñas no coinciden.", pwDone: "Contraseña actualizada." },
  pt: { emailTitle: "Mudar email", newEmail: "Novo email", emailPh: "novo@exemplo.com", sendBtn: "Atualizar email →", sending: "Enviando…", badEmail: "Digite um email novo válido.", sameEmail: "Esse já é o seu email.", emailSent: "Links de confirmação enviados. Verifique AS DUAS caixas — o email atual e o novo — e clique nos dois links.", pwTitle: "Mudar senha", newPw: "Nova senha", pwPh: "Pelo menos 8 caracteres", confirmPw: "Confirme a nova senha", confirmPh: "A mesma senha de novo", saveBtn: "Atualizar senha →", saving: "Salvando…", shortPw: "A senha precisa de pelo menos 8 caracteres.", mismatch: "As senhas não coincidem.", pwDone: "Senha atualizada." },
  hi: { emailTitle: "Email बदलो", newEmail: "नया email", emailPh: "naya@example.com", sendBtn: "Email अपडेट करो →", sending: "भेज रहे हैं…", badEmail: "सही नया email लिखो।", sameEmail: "यह तो पहले से आपका email है।", emailSent: "Confirmation links भेज दिए। दोनों inbox देखो — पुराना और नया — और दोनों links पर क्लिक करो।", pwTitle: "Password बदलो", newPw: "नया password", pwPh: "कम से कम 8 अक्षर", confirmPw: "नया password फिर से", confirmPh: "वही password दोबारा", saveBtn: "Password अपडेट करो →", saving: "सेव हो रहा है…", shortPw: "Password कम से कम 8 अक्षर का हो।", mismatch: "Passwords मेल नहीं खाते।", pwDone: "Password बदल गया।" },
  pl: { emailTitle: "Zmień email", newEmail: "Nowy email", emailPh: "nowy@przyklad.com", sendBtn: "Zaktualizuj email →", sending: "Wysyłanie…", badEmail: "Wpisz poprawny nowy email.", sameEmail: "To już jest twój email.", emailSent: "Linki potwierdzające wysłane. Sprawdź OBIE skrzynki — obecny i nowy email — i kliknij oba linki.", pwTitle: "Zmień hasło", newPw: "Nowe hasło", pwPh: "Co najmniej 8 znaków", confirmPw: "Potwierdź nowe hasło", confirmPh: "To samo hasło jeszcze raz", saveBtn: "Zaktualizuj hasło →", saving: "Zapisywanie…", shortPw: "Hasło musi mieć co najmniej 8 znaków.", mismatch: "Hasła się nie zgadzają.", pwDone: "Hasło zmienione." },
  fr: { emailTitle: "Changer l'email", newEmail: "Nouvel email", emailPh: "nouveau@exemple.com", sendBtn: "Mettre à jour l'email →", sending: "Envoi…", badEmail: "Entre un nouvel email valide.", sameEmail: "C'est déjà ton email.", emailSent: "Liens de confirmation envoyés. Vérifie LES DEUX boîtes — l'actuel et le nouveau — et clique sur les deux liens.", pwTitle: "Changer le mot de passe", newPw: "Nouveau mot de passe", pwPh: "Au moins 8 caractères", confirmPw: "Confirme le mot de passe", confirmPh: "Le même encore une fois", saveBtn: "Mettre à jour →", saving: "Enregistrement…", shortPw: "Au moins 8 caractères pour le mot de passe.", mismatch: "Les mots de passe ne correspondent pas.", pwDone: "Mot de passe mis à jour." },
};

export default function SettingsPage() {
  const { lang } = useLang();
  const t = T[lang] || T.en;
  const router = useRouter();
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [busyEmail, setBusyEmail] = useState(false);
  const [busyPw, setBusyPw] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setCurrentEmail(data.user.email ?? null);
      }
    });
  }, [router]);

  async function changeEmail() {
    setEmailErr(null);
    setEmailMsg(null);
    const target = newEmail.trim();
    if (!target || !target.includes("@")) {
      setEmailErr(t.badEmail);
      return;
    }
    if (target === currentEmail) {
      setEmailErr(t.sameEmail);
      return;
    }
    setBusyEmail(true);
    const { error } = await supabase.auth.updateUser({ email: target });
    setBusyEmail(false);
    if (error) {
      setEmailErr(error.message);
    } else {
      setEmailMsg(t.emailSent);
      setNewEmail("");
    }
  }

  async function changePassword() {
    setPwErr(null);
    setPwMsg(null);
    if (newPassword.length < 8) {
      setPwErr(t.shortPw);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErr(t.mismatch);
      return;
    }
    setBusyPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusyPw(false);
    if (error) {
      setPwErr(error.message);
    } else {
      setPwMsg(t.pwDone);
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  const inputCls =
    "w-full px-4 py-3 rounded-xl border-2 border-[#1c1410] bg-white outline-none focus:border-[#6b4eff]";
  const labelCls = "block font-mono text-[10px] uppercase tracking-widest mb-1";
  const btnCls =
    "px-5 py-3 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-[14px] hover:translate-y-[-2px] transition-transform disabled:opacity-50";
  const cardCls =
    "bg-[#fff6ec] rounded-3xl border-[3px] border-[#1c1410] shadow-[8px_8px_0_rgba(28,20,16,0.9)] p-6";

  return (
    <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px]">
        <div className="flex items-center justify-between mb-6">
          <div className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">
            settings<span className="text-[#c8f000]">.</span>
          </div>
          <Link
            href="/"
            className="font-mono text-[11px] underline underline-offset-4 text-[#fff6ec]/90"
          >
            back to elsewhr
          </Link>
        </div>

        {/* Change email */}
        <div className={cardCls}>
          <h2 className="font-[Syne] font-extrabold text-xl mb-1">{t.emailTitle}</h2>
          {currentEmail && (
            <p className="font-mono text-[11px] text-[#6b5e52] mb-4">
              current: {currentEmail}
            </p>
          )}
          <label className={labelCls}>{t.newEmail}</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={t.emailPh}
            className={`${inputCls} mb-4`}
          />
          <button onClick={changeEmail} disabled={busyEmail} className={btnCls}>
            {busyEmail ? t.sending : t.sendBtn}
          </button>
          {emailMsg && (
            <p className="mt-3 text-sm font-medium text-[#2e7d32]">{emailMsg}</p>
          )}
          {emailErr && (
            <p className="mt-3 text-sm font-medium text-[#b03a3a]">{emailErr}</p>
          )}
        </div>

        {/* Change password */}
        <div className={`${cardCls} mt-6`}>
          <h2 className="font-[Syne] font-extrabold text-xl mb-4">{t.pwTitle}</h2>
          <label className={labelCls}>{t.newPw}</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t.pwPh}
            className={`${inputCls} mb-3`}
            autoComplete="new-password"
          />
          <label className={labelCls}>{t.confirmPw}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t.confirmPh}
            className={`${inputCls} mb-4`}
            autoComplete="new-password"
          />
          <button onClick={changePassword} disabled={busyPw} className={btnCls}>
            {busyPw ? t.saving : t.saveBtn}
          </button>
          {pwMsg && <p className="mt-3 text-sm font-medium text-[#2e7d32]">{pwMsg}</p>}
          {pwErr && <p className="mt-3 text-sm font-medium text-[#b03a3a]">{pwErr}</p>}
        </div>

        <p className="font-mono text-[11px] text-[#fff6ec]/80 mt-6 text-center">
          need account recovery help? email you@elsewhr — a human answers.
        </p>
      </div>
    </main>
  );
}
