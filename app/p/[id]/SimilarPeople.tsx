"use client";

// elsewhr — similar vibes: volleyball people find volleyball people.
// New file: app/p/[id]/SimilarPeople.tsx
// Shares any mindset tag with this profile -> you appear here. Interests are the wiring.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";

type Mini = {
  id: number;
  name: string;
  photo?: string | null;
  accent?: string | null;
  mindset?: string[] | null;
  dest_place?: string | null;
  location?: string | null;
};

const TITLES: Record<string, string> = {
  en: "✨ similar vibes",
  es: "✨ misma onda",
  pt: "✨ mesma vibe",
  hi: "✨ मिलती-जुलती vibe",
  pl: "✨ podobne klimaty",
  fr: "✨ mêmes vibes",
};

export default function SimilarPeople({
  profileId,
  tags,
}: {
  profileId: number;
  tags: string[];
}) {
  const { lang } = useLang();
  const [people, setPeople] = useState<Mini[]>([]);

  useEffect(() => {
    if (!tags || tags.length === 0) return;
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, name, photo, accent, mindset, dest_place, location")
        .overlaps("mindset", tags)
        .neq("id", profileId)
        .not("user_id", "is", null)
        .limit(12);
      if (!alive) return;
      const rows = ((data ?? []) as (Mini & { user_id?: string | null })[])
        .map((p) => ({
          ...p,
          overlap: (p.mindset ?? []).filter((t) => tags.includes(t)).length,
        }))
        .sort((a, b) => b.overlap - a.overlap)
        .slice(0, 4);
      setPeople(rows);
    })();
    return () => {
      alive = false;
    };
  }, [profileId, tags]);

  if (people.length === 0) return null;

  return (
    <div className="rise mt-8" style={{ animationDelay: "160ms" }}>
      <p className="font-mono text-[11px] uppercase tracking-widest text-[#fff6ec]/70 mb-3">
        {TITLES[lang] || TITLES.en}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {people.map((p) => (
          <Link
            key={p.id}
            href={"/p/" + p.id}
            className="bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-2xl p-3.5 shadow-[5px_5px_0_rgba(28,20,16,0.9)] hover:translate-y-[-2px] transition-transform"
            style={{ borderTopColor: p.accent || "#6b4eff", borderTopWidth: 6 }}
          >
            <div className="flex items-center gap-2.5">
              {p.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photo} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-[#1c1410]" />
              ) : (
                <div
                  className="w-10 h-10 rounded-full border-2 border-[#1c1410] flex items-center justify-center font-bold text-white"
                  style={{ background: p.accent || "#6b4eff" }}
                >
                  {(p.name || "?").slice(0, 1)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-[Syne] font-extrabold text-[14.5px] leading-tight truncate text-[#1c1410]">{p.name}</p>
                <p className="text-[11px] font-bold text-[#6b4eff] truncate">
                  {(p.mindset ?? []).filter((t) => tags.includes(t)).slice(0, 2).join(" · ")}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
