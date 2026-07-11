"use client";

// elsewhr — account settings: change email / change password
// Create this file at: app/settings/page.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
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
      setEmailErr("Enter a valid new email address.");
      return;
    }
    if (target === currentEmail) {
      setEmailErr("That's already your email.");
      return;
    }
    setBusyEmail(true);
    const { error } = await supabase.auth.updateUser({ email: target });
    setBusyEmail(false);
    if (error) {
      setEmailErr(error.message);
    } else {
      setEmailMsg(
        "Confirmation links sent. Check BOTH inboxes — your current email and the new one — and click both links to complete the change."
      );
      setNewEmail("");
    }
  }

  async function changePassword() {
    setPwErr(null);
    setPwMsg(null);
    if (newPassword.length < 8) {
      setPwErr("Password needs at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErr("Passwords don't match.");
      return;
    }
    setBusyPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusyPw(false);
    if (error) {
      setPwErr(error.message);
    } else {
      setPwMsg("Password updated.");
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
          <h2 className="font-[Syne] font-extrabold text-xl mb-1">Change email</h2>
          {currentEmail && (
            <p className="font-mono text-[11px] text-[#6b5e52] mb-4">
              current: {currentEmail}
            </p>
          )}
          <label className={labelCls}>New email</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new@example.com"
            className={`${inputCls} mb-4`}
          />
          <button onClick={changeEmail} disabled={busyEmail} className={btnCls}>
            {busyEmail ? "Sending…" : "Update email →"}
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
          <h2 className="font-[Syne] font-extrabold text-xl mb-4">Change password</h2>
          <label className={labelCls}>New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={`${inputCls} mb-3`}
            autoComplete="new-password"
          />
          <label className={labelCls}>Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Same password again"
            className={`${inputCls} mb-4`}
            autoComplete="new-password"
          />
          <button onClick={changePassword} disabled={busyPw} className={btnCls}>
            {busyPw ? "Saving…" : "Update password →"}
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
