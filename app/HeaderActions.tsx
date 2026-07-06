"use client";

// elsewhr — smart header button: "Edit my profile" if logged in, "Join elsewhr" if not
// Create this file at: app/HeaderActions.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function HeaderActions() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
  }, []);

  // while checking, render the join button (avoids layout jump)
  if (loggedIn === null || !loggedIn) {
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
    <Link
      href="/create"
      className="px-4 py-2 rounded-xl border-2 border-[#1c1410] bg-[#fff6ec] font-bold text-sm hover:translate-y-[-2px] transition-transform"
    >
      ✏️ Edit my profile
    </Link>
  );
}
