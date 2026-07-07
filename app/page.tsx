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
    <main className="relative min-h-screen bg-[#ff5d3b] text-[#1c1410] flex justify-center px-4 py-8 overflow-hidden">
      <style>{`
        @keyframes rise { from { opacity:0; transform:translateY(26px);} to { opacity:1; transform:none;} }
        @keyframes drift1 { 0%,100% { transform:translate(0,0) scale(1);} 50% { transform:translate(40px,-30px) scale(1.08);} }
        @keyframes drift2 { 0%,100% { transform:translate(0,0) scale(1);} 50% { transform:translate(-50px,25px) scale(0.94);} }
        @keyframes bob { 0%,100% { transform:translateY(0);} 50% { transform:translateY(-7px);} }
        @keyframes waveShift { from { transform:translateX(0);} to { transform:translateX(-50%);} }
        .rise { animation: rise .55s cubic-bezier(.2,.7,.3,1) both; }
        .bob { animation: bob 3.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .rise,.bob,.blob,.wave { animation:none !important; } }
      `}</style>

      {/* wind — drifting ambient blobs */}
      <div aria-hidden className="blob absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#c8f000] opacity-[0.13] blur-3xl" style={{ animation: "drift1 14s ease-in-out infinite" }} />
      <div aria-hidden className="blob absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-[#6b4eff] opacity-[0.14] blur-3xl" style={{ animation: "drift2 18s ease-in-out infinite" }} />
      <div aria-hidden className="blob absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-[#00c2d1] opacity-[0.10] blur-3xl" style={{ animation: "drift1 22s ease-in-out infinite reverse" }} />

      {/* waves at the bottom */}
      <div aria-hidden className="absolute bottom-0 left-0 w-[200%] pointer-events-none" style={{ animation: "waveShift 16s linear infinite" }}>
        <svg viewBox="0 0 1440 70" className="w-1/2 inline-block align-bottom" preserveAspectRatio="none" height="46">
          <path d="M0,40 C240,70 480,10 720,40 C960,70 1200,10 1440,40 L1440,70 L0,70 Z" fill="#1c1410" opacity="0.10"/>
        </svg><svg viewBox="0 0 1440 70" className="w-1/2 inline-block align-bottom" preserveAspectRatio="none" height="46">
          <path d="M0,40 C240,70 480,10 720,40 C960,70 1200,10 1440,40 L1440,70 L0,70 Z" fill="#1c1410" opacity="0.10"/>
        </svg>
      </div>

      <div className="relative w-full max-w-[560px]">
        {/* brand + action */}
        <div className="flex items-center justify-between mb-2">
          <div className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">
            elsewhr<span className="text-[#c8f000]">.</span>
          </div>
          <div className="flex items-center gap-3">
            <HeaderActions />
            <span className="bob inline-block"><Bird /></span>
          </div>
        </div>

        <p className="rise text-[#fff6ec]/90 text-[15px] mb-7" style={{ animationDelay: "60ms" }}>
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
                  className="rise block bg-[#fff6ec] rounded-3xl border-[3px] border-[#1c1410] shadow-[6px_6px_0_rgba(28,20,16,0.85)] overflow-hidden hover:translate-y-[-4px] hover:rotate-[-0.4deg] hover:shadow-[9px_11px_0_rgba(28,20,16,0.85)] active:translate-y-0 active:shadow-[4px_4px_0_rgba(28,20,16,0.85)] transition-all duration-200"
                  style={{ animationDelay: `${profiles.indexOf(p) * 90}ms` }}
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
