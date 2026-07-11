"use client";

// elsewhr — password reset: request a link, or set a new password
// Create this file at: app/reset-password/page.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
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
      setErr("Enter the email you signed up with.");
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
      setMsg("Check your email — the bird is carrying your reset link. (Look in spam too.)");
    }
  }

  async function updatePassword() {
    setErr(null);
    setMsg(null);
    if (password.length < 8) {
      setErr("Password needs at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords don't match.");
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
          {mode === "update" ? "Set a new password" : mode === "done" ? "You're back in" : "Forgot your password?"}
        </h1>

        {mode === "request" && (
          <>
            <p className="text-[15px] opacity-80 mb-6">
              Enter your email and we&apos;ll send you a reset link.
            </p>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              autoComplete="email"
            />
            <div className="mt-4 flex items-center gap-4 flex-wrap">
              <button onClick={sendResetLink} disabled={busy} className={btnCls}>
                {busy ? "Sending…" : "Send reset link →"}
              </button>
              <Link href="/login" className="font-mono text-[12px] underline underline-offset-4 opacity-75">
                back to login
              </Link>
            </div>
          </>
        )}

        {mode === "update" && (
          <>
            <p className="text-[15px] opacity-80 mb-6">Choose a new password for your account.</p>
            <input
              type="password"
              placeholder="New password (8+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`${inputCls} mt-3`}
              autoComplete="new-password"
            />
            <div className="mt-4">
              <button onClick={updatePassword} disabled={busy} className={btnCls}>
                {busy ? "Saving…" : "Save new password →"}
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
