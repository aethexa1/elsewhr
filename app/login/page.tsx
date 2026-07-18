"use client";

// elsewhr — login / signup page
// Replace file at: app/login/page.tsx
// fix: escape hatch — wordmark links home + visible back link (no more trapped visitors)

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [msgKind, setMsgKind] = useState<"error" | "success">("error");
  const [busy, setBusy] = useState(false);

  // where a signed-in person belongs: has a profile -> feed; brand new -> build one with the bird
  async function routeSignedIn() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;
    let dest = "/create";
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userData.user.id)
      .limit(1)
      .maybeSingle();
    if (existing) dest = "/";
    window.location.assign(dest);
    return true;
  }

  // returning from Google lands back here with a session — route it home
  useEffect(() => {
    routeSignedIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogle() {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/login" },
    });
    if (error) {
      setMsgKind("error");
      setMsg(error.message);
      setBusy(false);
    }
    // on success the browser leaves for Google; no cleanup needed
  }

  async function handleSubmit() {
    if (!email || !password) {
      setMsgKind("error");
      setMsg("Enter your email and a password.");
      return;
    }
    setBusy(true);
    setMsg(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMsgKind("error");
        setMsg(error.message);
      } else {
        setMsgKind("success");
        setMsg("Account created! Check your email to confirm, then log in.");
        setMode("login");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMsgKind("error");
        setMsg(error.message);
      } else {
        await routeSignedIn();
        return;
      }
    }
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        {/* brand — the wordmark is a door home */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">
            elsewhr<span className="text-[#c8f000]">.</span>
          </Link>
          <Bird />
        </div>

        <div className="bg-[#fff6ec] rounded-3xl border-[3px] border-[#1c1410] shadow-[8px_8px_0_rgba(28,20,16,0.9)] p-6">
          <h1 className="font-[Syne] font-extrabold text-2xl leading-tight">
            {mode === "signup" ? "Join elsewhr" : "Welcome back"}
          </h1>
          <p className="text-sm mt-1 mb-5 text-[#6b5e52]">
            {mode === "signup"
              ? "Be seen for what you can actually do."
              : "Log in to your living profile."}
          </p>

          <button type="button" onClick={handleGoogle} disabled={busy}
            className="w-full py-3 rounded-xl border-2 border-[#1c1410] bg-white font-bold text-[15px] flex items-center justify-center gap-2.5 hover:translate-y-[-2px] transition-transform disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-[2px] bg-[#1c1410]/15" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#6b5e52]">or</span>
            <div className="flex-1 h-[2px] bg-[#1c1410]/15" />
          </div>

          <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full mb-4 px-4 py-3 rounded-xl border-2 border-[#1c1410] bg-white outline-none focus:border-[#6b4eff]"
          />

          <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full mb-2 px-4 py-3 rounded-xl border-2 border-[#1c1410] bg-white outline-none focus:border-[#6b4eff]"
          />

          {mode === "login" && (
            <div className="mb-4 text-right">
              <Link href="/reset-password" className="font-mono text-[11px] underline underline-offset-4 text-[#6b4eff]">
                Forgot password?
              </Link>
            </div>
          )}
          {mode === "signup" && <div className="mb-4" />}

          <button
            onClick={handleSubmit}
            disabled={busy}
            className="w-full py-3 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-[15px] hover:translate-y-[-2px] transition-transform disabled:opacity-50"
          >
            {busy ? "One sec…" : mode === "signup" ? "Create account" : "Log in"}
          </button>

          {msg && (
            <p
              className={`mt-4 text-sm text-center font-medium ${
                msgKind === "success" ? "text-[#2e7d32]" : "text-[#b03a3a]"
              }`}
            >
              {msg}
            </p>
          )}

          <p className="mt-5 text-sm text-center">
            {mode === "signup" ? "Already have an account?" : "New to elsewhr?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setMsg(null);
              }}
              className="font-bold underline text-[#6b4eff]"
            >
              {mode === "signup" ? "Log in" : "Sign up"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center">
          <Link href="/" className="font-mono text-[11px] text-[#fff6ec]/80 underline underline-offset-4 hover:text-[#fff6ec]">
            ← back to elsewhr
          </Link>
        </p>
        <p className="font-mono text-[11px] text-[#fff6ec]/80 mt-3 text-center">
          free · you own your profile · no data sold, ever
        </p>
      </div>
    </main>
  );
}

function Bird() {
  return (
    <svg width="48" height="53" viewBox="0 0 300 340" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="150" cy="305" rx="60" ry="9" fill="#1c1410" opacity="0.2" />
      <path d="M150 244 L116 300 L150 282 L184 300 Z" fill="#1c1410" />
      <ellipse cx="150" cy="222" rx="60" ry="66" fill="#1c1410" />
      <ellipse cx="150" cy="238" rx="33" ry="39" fill="#c8f000" />
      <circle cx="150" cy="134" r="43" fill="#1c1410" />
      <path d="M150 92 Q141 66 150 52 Q159 66 150 92" fill="#c8f000" />
      <path d="M150 94 Q133 76 128 62 Q151 70 150 94" fill="#c8f000" />
      <path d="M150 94 Q167 76 172 62 Q149 70 150 94" fill="#c8f000" />
      <circle cx="166" cy="128" r="13" fill="#fff6ec" />
      <circle cx="169" cy="130" r="6.5" fill="#1c1410" />
      <circle cx="171" cy="127" r="2.2" fill="#fff6ec" />
      <path d="M191 132 L217 138 L191 147 Z" fill="#c8f000" />
      <rect x="135" y="284" width="5" height="20" rx="2.5" fill="#c8f000" />
      <rect x="160" y="284" width="5" height="20" rx="2.5" fill="#c8f000" />
    </svg>
  );
}
