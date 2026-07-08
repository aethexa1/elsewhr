"use client";

// elsewhr — owner controls on your own profile page
// Create this file at: app/p/[id]/OwnerBar.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function OwnerBar({
  profileId,
  ownerUserId,
}: {
  profileId: number;
  ownerUserId: string | null;
}) {
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ownerUserId) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && data.user.id === ownerUserId) setIsOwner(true);
    });
  }, [ownerUserId]);

  if (!isOwner) return null;

  async function deleteProfile() {
    const sure = window.confirm(
      "Delete your profile from elsewhr? This removes it completely and can't be undone."
    );
    if (!sure) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").delete().eq("id", profileId);
    if (error) {
      alert("Couldn't delete: " + error.message);
      setBusy(false);
    } else {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="rise mt-4 flex items-center justify-between bg-[#1c1410] border-[3px] border-[#1c1410] rounded-2xl px-4 py-3" style={{ animationDelay: "80ms" }}>
      <p className="font-mono text-[11px] text-[#c8f000]">this is your profile</p>
      <div className="flex items-center gap-3">
        <Link
          href="/create"
          className="px-4 py-2 rounded-xl border-2 border-[#fff6ec] bg-[#fff6ec] text-[#1c1410] font-bold text-sm hover:translate-y-[-2px] transition-transform"
        >
          ✏️ Edit
        </Link>
        <button
          onClick={deleteProfile}
          disabled={busy}
          className="font-mono text-[11px] text-[#fff6ec]/60 underline hover:text-[#ff8f75] disabled:opacity-40"
        >
          {busy ? "deleting…" : "delete"}
        </button>
      </div>
    </div>
  );
}
