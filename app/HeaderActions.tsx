"use client";

// elsewhr — account menu: who you are, edit, settings, sign out
// Replaces app/HeaderActions.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function HeaderActions() {
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setChecked(true);
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setEmail(null);
    setOpen(false);
    window.location.assign("/");
  }

  if (!checked || !email) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-sm hover:translate-y-[-2px] transition-transform"
      >
        Join elsewhr →
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#1c1410] bg-[#fff6ec] font-bold text-sm hover:translate-y-[-2px] transition-transform"
      >
        <span className="w-5 h-5 rounded-full bg-[#6b4eff] text-[#fff6ec] flex items-center justify-center text-[11px] font-extrabold">
          {email[0].toUpperCase()}
        </span>
        me
        <span className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-2xl shadow-[6px_6px_0_rgba(28,20,16,0.85)] overflow-hidden z-20">
          <p className="px-4 pt-3 pb-2 font-mono text-[10px] text-[#6b5e52] truncate border-b border-[#1c1410]/10">
            {email}
          </p>
          <Link
            href="/create"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm font-bold hover:bg-[#c8f000]/40"
          >
            ✏️ Edit my profile
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm font-bold hover:bg-[#c8f000]/40 border-t border-[#1c1410]/10"
          >
            ⚙️ Settings
          </Link>
          <button
            onClick={signOut}
            className="block w-full text-left px-4 py-3 text-sm font-bold hover:bg-[#ff5d3b]/20 border-t border-[#1c1410]/10"
          >
            👋 Sign out
          </button>
        </div>
      )}
    </div>
  );
}
