"use client";

// elsewhr — password reset: request a link, or set a new password
// Create this file at: app/reset-password/page.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";

const T: Record<string, {
  titleForgot: string; titleSet: string; titleDone: string;
  needEmail: string; sent: string; shortPw: string; mismatch: string;
  emailPh: string; sendBtn: string; sending: string; choose: string;
  newPh: string; confirmPh: string; saveBtn: string; saving: string;
}> = {
  en: { titleForgot: "Forgot your password?", titleSet: "Set a new password", titleDone: "You're back in", needEmail: "Enter the email you signed up with.", sent: "Check your email — the bird is carrying your reset link. (Look in spam too.)", shortPw: "Password needs at least 8 characters.", mismatch: "Passwords don't match.", emailPh: "you@example.com", sendBtn: "Send reset link →", sending: "Sending…", choose: "Choose a new password for your account.", newPh: "New password (8+ characters)", confirmPh: "Confirm new password", saveBtn: "Save new password →", saving: "Saving…" },
  es: { titleForgot: "¿Olvidaste tu contraseña?", titleSet: "Crea una nueva contraseña", titleDone: "Ya estás dentro", needEmail: "Escribe el email con el que te registraste.", sent: "Revisa tu email — el pájaro lleva tu enlace. (Mira también en spam.)", shortPw: "La contraseña necesita al menos 8 caracteres.", mismatch: "Las contraseñas no coinciden.", emailPh: "tu@ejemplo.com", sendBtn: "Enviar enlace →", sending: "Enviando…", choose: "Elige una nueva contraseña para tu cuenta.", newPh: "Nueva contraseña (8+ caracteres)", confirmPh: "Confirma la contraseña", saveBtn: "Guardar contraseña →", saving: "Guardando…" },
  pt: { titleForgot: "Esqueceu a senha?", titleSet: "Crie uma nova senha", titleDone: "Você voltou", needEmail: "Digite o email com que se cadastrou.", sent: "Veja seu email — o pássaro leva seu link. (Olhe o spam também.)", shortPw: "A senha precisa de pelo menos 8 caracteres.", mismatch: "As senhas não coincidem.", emailPh: "voce@exemplo.com", sendBtn: "Enviar link →", sending: "Enviando…", choose: "Escolha uma nova senha para sua conta.", newPh: "Nova senha (8+ caracteres)", confirmPh: "Confirme a nova senha", saveBtn: "Salvar senha →", saving: "Salvando…" },
  hi: { titleForgot: "Password भूल गए?", titleSet: "नया password बनाओ", titleDone: "आप वापस अंदर हैं", needEmail: "वही email लिखो जिससे साइन-अप किया था।", sent: "अपना email देखो — चिड़िया आपका link ला रही है। (Spam भी देखना।)", shortPw: "Password कम से कम 8 अक्षर का हो।", mismatch: "Passwords मेल नहीं खाते।", emailPh: "aap@example.com", sendBtn: "Reset link भेजो →", sending: "भेज रहे हैं…", choose: "अपने account के लिए नया password चुनो।", newPh: "नया password (8+ अक्षर)", confirmPh: "Password फिर से", saveBtn: "नया password सेव करो →", saving: "सेव हो रहा है…" },
  pl: { titleForgot: "Zapomniałeś hasła?", titleSet: "Ustaw nowe hasło", titleDone: "Jesteś z powrotem", needEmail: "Wpisz email, którym się rejestrowałeś.", sent: "Sprawdź email — ptak niesie twój link. (Zajrzyj też do spamu.)", shortPw: "Hasło musi mieć co najmniej 8 znaków.", mismatch: "Hasła się nie zgadzają.", emailPh: "ty@przyklad.com", sendBtn: "Wyślij link →", sending: "Wysyłanie…", choose: "Wybierz nowe hasło do konta.", newPh: "Nowe hasło (8+ znaków)", confirmPh: "Potwierdź nowe hasło", saveBtn: "Zapisz hasło →", saving: "Zapisywanie…" },
  fr: { titleForgot: "Mot de passe oublié ?", titleSet: "Choisis un nouveau mot de passe", titleDone: "Te revoilà", needEmail: "Entre l'email avec lequel tu t'es inscrit.", sent: "Regarde tes emails — l'oiseau apporte ton lien. (Vérifie aussi les spams.)", shortPw: "Au moins 8 caractères.", mismatch: "Les mots de passe ne correspondent pas.", emailPh: "toi@exemple.com", sendBtn: "Envoyer le lien →", sending: "Envoi…", choose: "Choisis un nouveau mot de passe.", newPh: "Nouveau mot de passe (8+)", confirmPh: "Confirme le mot de passe", saveBtn: "Enregistrer →", saving: "Enregistrement…" },
};
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const { lang } = useLang();
  const t = T[lang] || T.en;
  const [mode, setMode] = useState<"request" | "update" | "done">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // If the user arrived from the recovery email link, Supabase fires this event
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("update");
    });
    // Fallback: detect the recovery hash directly
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("update");
    }
    return () => sub.subscription.unsubscribe();
  }, []);

  async function sendResetLink() {
    setErr(null);
    setMsg(null);
    if (!email.trim()) {
      setErr(t.needEmail);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
    } else {
      setMsg(t.sent);
    }
  }

  async function updatePassword() {
    setErr(null);
    setMsg(null);
    if (password.length < 8) {
      setErr(t.shortPw);
      return;
    }
    if (password !== confirm) {
      setErr(t.mismatch);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setErr(error.message);
    } else {
      setMode("done");
    }
  }

  const inputCls =
    "w-full px-4 py-3 rounded-2xl border-[3px] border-[#1c1410] bg-[#fff6ec] text-[#1c1410] text-[15px] outline-none focus:shadow-[4px_4px_0_#1c1410] transition-shadow";
  const btnCls =
    "px-6 py-3.5 rounded-2xl border-[3px] border-[#1c1410] bg-[#c8f000] font-bold text-[15px] text-[#1c1410] shadow-[5px_5px_0_#1c1410] hover:translate-y-[-2px] hover:shadow-[7px_8px_0_#1c1410] active:translate-y-0 active:shadow-[3px_3px_0_#1c1410] transition-all disabled:opacity-50 disabled:pointer-events-none";

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="font-[Syne] font-extrabold text-3xl md:text-4xl leading-tight tracking-tight mb-2">
          {mode === "update" ? t.titleSet : mode === "done" ? t.titleDone : t.titleForgot}
        </h1>

        {mode === "request" && (
          <>
            <p className="text-[15px] opacity-80 mb-6">
              Enter your email and we&apos;ll send you a reset link.
            </p>
            <input
              type="email"
              placeholder={t.emailPh}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              autoComplete="email"
            />
            <div className="mt-4 flex items-center gap-4 flex-wrap">
              <button onClick={sendResetLink} disabled={busy} className={btnCls}>
                {busy ? t.sending : t.sendBtn}
              </button>
              <Link href="/login" className="font-mono text-[12px] underline underline-offset-4 opacity-75">
                back to login
              </Link>
            </div>
          </>
        )}

        {mode === "update" && (
          <>
            <p className="text-[15px] opacity-80 mb-6">{t.choose}</p>
            <input
              type="password"
              placeholder={t.newPh}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
            <input
              type="password"
              placeholder={t.confirmPh}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`${inputCls} mt-3`}
              autoComplete="new-password"
            />
            <div className="mt-4">
              <button onClick={updatePassword} disabled={busy} className={btnCls}>
                {busy ? t.saving : t.saveBtn}
              </button>
            </div>
          </>
        )}

        {mode === "done" && (
          <>
            <p className="text-[15px] opacity-80 mb-6">
              Password updated. You&apos;re signed in — head back to your feed.
            </p>
            <Link href="/" className={btnCls}>
              Go to elsewhr →
            </Link>
          </>
        )}

        {msg && <p className="mt-4 text-[14px] font-mono text-[#1c1410] bg-[#c8f000]/40 border-[3px] border-[#1c1410] rounded-2xl px-4 py-3">{msg}</p>}
        {err && <p className="mt-4 text-[14px] font-mono bg-red-100 border-[3px] border-[#1c1410] rounded-2xl px-4 py-3">{err}</p>}
      </div>
    </main>
  );
}
