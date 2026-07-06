// elsewhr — home: the profile feed (replaces app/page.tsx)

import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import HeaderActions from "./HeaderActions";

export const dynamic = "force-dynamic";

type Artifact = {
  claim: string;
  image: string;
  result: string;
  field: string;
  vouch: string;
};

type Profile = {
  id: number;
  name: string;
  photo?: string | null;
  headline: string;
  location: string;
  seeking?: string | null;
  mindset?: string[] | null;
  learning?: string | null;
  goal?: string | null;
  artifacts: Artifact[] | null;
};

export default async function Home() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("id", { ascending: false });

  if (error || !data || data.length === 0) {
    return (
      <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex items-center justify-center px-4">
        <div className="bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl p-8 max-w-md text-center">
          <p className="font-bold text-lg mb-2">No profiles yet.</p>
          <p className="text-sm">
            {error ? `(${error.message})` : "Be the first —"}{" "}
            <Link href="/login" className="underline font-bold text-[#6b4eff]">
              join elsewhr
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const profiles = data as Profile[];

  return (
    <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex justify-center px-4 py-10">
      <div className="w-full max-w-[560px]">
        {/* brand + join */}
        <div className="flex items-center justify-between mb-8">
          <div className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">
            elsewhr<span className="text-[#c8f000]">.</span>
          </div>
          <div className="flex items-center gap-3">
            <HeaderActions />
            <Bird />
          </div>
        </div>

        {profiles.map((profile) => (
          <section key={profile.id} className="mb-12">
            {/* header */}
            <header className="bg-[#1c1410] text-[#fff6ec] rounded-3xl p-6 border-[3px] border-[#1c1410] shadow-[8px_8px_0_rgba(28,20,16,0.35)]">
              <div className="flex items-center gap-4">
                {profile.photo && (
                  <img
                    src={profile.photo}
                    alt={profile.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#c8f000] flex-none"
                  />
                )}
                <h1 className="font-[Syne] font-extrabold text-3xl leading-none tracking-tight">
                  {profile.name}
                </h1>
              </div>
              <p className="text-[#c8f000] font-semibold mt-2">{profile.headline}</p>
              {profile.seeking && (
                <p className="text-[14px] mt-2 text-[#fff6ec]/90">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#00c2d1]">
                    looking for ·{" "}
                  </span>
                  {profile.seeking}
                </p>
              )}
              {profile.mindset && profile.mindset.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {profile.mindset.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-[#6b4eff] text-[#fff6ec] text-[11px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="font-mono text-xs text-[#9a8e82] mt-3 tracking-wide">
                {profile.location || "somewhere"} · shows real work, not a résumé
              </p>
            </header>

            {/* the work */}
            {profile.artifacts && profile.artifacts.length > 0 && (
              <>
                <h2 className="font-[Syne] font-bold text-lg mt-6 mb-3 text-[#fff6ec]">
                  The work
                </h2>
                <div className="flex flex-col gap-4">
                  {profile.artifacts.map((a, i) => (
                    <article
                      key={i}
                      className="bg-[#fff6ec] rounded-3xl overflow-hidden border-[3px] border-[#1c1410] shadow-[8px_8px_0_rgba(28,20,16,0.9)]"
                    >
                      {a.image && (
                        <div className="relative">
                          <img src={a.image} alt={a.claim} className="w-full h-52 object-cover" />
                          {a.field && (
                            <span className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-widest bg-[#1c1410] text-[#fff6ec] px-2.5 py-1 rounded-full">
                              {a.field}
                            </span>
                          )}
                          {a.result && (
                            <span className="absolute bottom-3 right-3 font-[Syne] font-bold text-sm bg-[#c8f000] text-[#1c1410] px-3 py-1 rounded-full">
                              {a.result}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="p-5">
                        {!a.image && a.field && (
                          <span className="inline-block mb-2 font-mono text-[10px] uppercase tracking-widest bg-[#1c1410] text-[#fff6ec] px-2.5 py-1 rounded-full">
                            {a.field}
                          </span>
                        )}
                        <p className="font-semibold text-[15px] leading-snug">{a.claim}</p>
                        {!a.image && a.result && (
                          <span className="inline-block mt-2 font-[Syne] font-bold text-sm bg-[#c8f000] text-[#1c1410] px-3 py-1 rounded-full">
                            {a.result}
                          </span>
                        )}
                        {a.vouch && (
                          <p className="text-[13px] text-[#6b4eff] mt-2 italic">{a.vouch}</p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            {/* learning + goal */}
            {(profile.learning || profile.goal) && (
              <div className="mt-4 bg-[#fff6ec] rounded-2xl border-[3px] border-[#1c1410] p-4 text-[14px]">
                {profile.learning && (
                  <p>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#b9542f]">
                      now learning ·{" "}
                    </span>
                    {profile.learning}
                  </p>
                )}
                {profile.goal && (
                  <p className="mt-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#6b4eff]">
                      future goal ·{" "}
                    </span>
                    {profile.goal}
                  </p>
                )}
              </div>
            )}
          </section>
        ))}

        <p className="font-mono text-[11px] text-[#fff6ec]/80 mt-2 text-center">
          real people · real work · live from the database
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
