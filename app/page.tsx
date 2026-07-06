// elsewhr — home: the glanceable feed (replaces app/page.tsx)

import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import HeaderActions from "./HeaderActions";

export const dynamic = "force-dynamic";

type Profile = {
  id: number;
  name: string;
  photo?: string | null;
  headline: string;
  location: string;
  seeking?: string | null;
  mindset?: string[] | null;
  artifacts: { image?: string }[] | null;
};

export default async function Home() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, photo, headline, location, seeking, mindset, artifacts")
    .order("id", { ascending: false });

  const profiles = (data ?? []) as Profile[];

  return (
    <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex justify-center px-4 py-8">
      <div className="w-full max-w-[560px]">
        {/* brand + action */}
        <div className="flex items-center justify-between mb-2">
          <div className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">
            elsewhr<span className="text-[#c8f000]">.</span>
          </div>
          <div className="flex items-center gap-3">
            <HeaderActions />
            <Bird />
          </div>
        </div>

        <p className="text-[#fff6ec]/90 text-[15px] mb-7">
          real people, shown by what they can actually do.
        </p>

        {error || profiles.length === 0 ? (
          <div className="bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl p-8 text-center">
            <p className="font-bold text-lg mb-2">No profiles yet.</p>
            <p className="text-sm">
              Be the first —{" "}
              <Link href="/login" className="underline font-bold text-[#6b4eff]">
                join elsewhr
              </Link>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {profiles.map((p) => {
              const workImage = p.artifacts?.find((a) => a.image)?.image;
              return (
                <Link
                  key={p.id}
                  href={`/p/${p.id}`}
                  className="block bg-[#fff6ec] rounded-3xl border-[3px] border-[#1c1410] shadow-[6px_6px_0_rgba(28,20,16,0.85)] overflow-hidden hover:translate-y-[-3px] hover:shadow-[8px_10px_0_rgba(28,20,16,0.85)] transition-all"
                >
                  <div className="p-5 flex items-center gap-4">
                    {p.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photo}
                        alt={p.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#1c1410] flex-none"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#6b4eff] text-[#fff6ec] flex items-center justify-center font-[Syne] font-extrabold text-2xl flex-none">
                        {p.name?.[0] ?? "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-[Syne] font-extrabold text-xl leading-tight truncate">
                        {p.name}
                      </p>
                      <p className="text-[13.5px] leading-snug text-[#3a2c20] line-clamp-2">
                        {p.headline}
                      </p>
                      {p.mindset && p.mindset.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {p.mindset.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-[#6b4eff] text-[#fff6ec] text-[10.5px] font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {workImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={workImage} alt="" className="w-full h-36 object-cover border-t-[3px] border-[#1c1410]" />
                  )}
                </Link>
              );
            })}
          </div>
        )}

        <p className="font-mono text-[11px] text-[#fff6ec]/80 mt-8 text-center">
          tap anyone to see their work · real people · live
        </p>
      </div>
    </main>
  );
}

function Bird() {
  return (
    <svg width="44" height="49" viewBox="0 0 300 340" xmlns="http://www.w3.org/2000/svg">
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
