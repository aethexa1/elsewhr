"use client";

// elsewhr — create-profile placeholder (the real form is the next brick)
// Create this file at: app/create/page.tsx

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CreatePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setEmail(data.user.email ?? null);
      }
    });
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px]">
        <div className="bg-[#fff6ec] rounded-3xl border-[3px] border-[#1c1410] shadow-[8px_8px_0_rgba(28,20,16,0.9)] p-7 text-center">
          <div className="font-[Syne] font-extrabold text-2xl mb-1">
            You&apos;re in<span className="text-[#ff5d3b]">.</span>
          </div>
          {email && (
            <p className="font-mono text-xs text-[#6b5e52] mb-4">logged in as {email}</p>
          )}
          <p className="text-[15px] leading-relaxed mb-5">
            Welcome to elsewhr. This is where you&apos;ll build your living profile —
            your work, your mindset, what you&apos;re looking for. That form is the
            very next thing being built.
          </p>
          <p className="font-mono text-[11px] text-[#6b4eff] mb-6">
            you are one of the first people ever to log into elsewhr.
          </p>
          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-xl border-2 border-[#1c1410] bg-[#fff6ec] font-bold text-sm hover:translate-y-[-2px] transition-transform"
          >
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}
