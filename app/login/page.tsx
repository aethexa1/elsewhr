"use client";

// elsewhr — login / signup page
// Create this file at: app/login/page.tsx

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      setMsg("Enter your email and a password.");
      return;
    }
    setBusy(true);
    setMsg(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMsg(error.message);
      } else {
        setMsg("Account created! Check your email to confirm, then log in.");
        setMode("login");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMsg(error.message);
      } else {
        router.push("/create");
      }
    }
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        {/* brand */}
        <div className="flex items-center justify-between mb-6">
          <div className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">
            elsewhr<span className="text-[#c8f000]">.</span>
          </div>
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
            className="w-full mb-5 px-4 py-3 rounded-xl border-2 border-[#1c1410] bg-white outline-none focus:border-[#6b4eff]"
          />

          <button
            onClick={handleSubmit}
            disabled={busy}
            className="w-full py-3 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-[15px] hover:translate-y-[-2px] transition-transform disabled:opacity-50"
          >
            {busy ? "One sec…" : mode === "signup" ? "Create account" : "Log in"}
          </button>

          {msg && (
            <p className="mt-4 text-sm text-center text-[#b03a3a] font-medium">{msg}</p>
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

        <p className="font-mono text-[11px] text-[#fff6ec]/80 mt-6 text-center">
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
