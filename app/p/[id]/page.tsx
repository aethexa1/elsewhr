// elsewhr — individual profile page
// Create this file at: app/p/[id]/page.tsx

import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

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

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", Number(id))
    .maybeSingle();

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex items-center justify-center px-4">
        <div className="bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-3xl p-8 max-w-md text-center">
          <p className="font-bold text-lg mb-2">Profile not found.</p>
          <Link href="/" className="underline font-bold text-[#6b4eff]">
            ← back to elsewhr
          </Link>
        </div>
      </main>
    );
  }

  const profile = data as Profile;

  return (
    <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex justify-center px-4 py-8">
      <div className="w-full max-w-[560px]">
        {/* top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]"
          >
            elsewhr<span className="text-[#c8f000]">.</span>
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl border-2 border-[#1c1410] bg-[#fff6ec] font-bold text-sm hover:translate-y-[-2px] transition-transform"
          >
            ← everyone
          </Link>
        </div>

        {/* header */}
        <header className="bg-[#1c1410] text-[#fff6ec] rounded-3xl p-6 border-[3px] border-[#1c1410] shadow-[8px_8px_0_rgba(28,20,16,0.35)]">
          <div className="flex items-center gap-4">
            {profile.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photo}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-[#c8f000] flex-none"
              />
            )}
            <div>
              <h1 className="font-[Syne] font-extrabold text-3xl leading-none tracking-tight">
                {profile.name}
              </h1>
              <p className="text-[#c8f000] font-semibold mt-2">{profile.headline}</p>
            </div>
          </div>
          {profile.seeking && (
            <p className="text-[14px] mt-3 text-[#fff6ec]/90">
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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

        <p className="font-mono text-[11px] text-[#fff6ec]/80 mt-8 text-center">
          this is a living profile on elsewhr ·{" "}
          <Link href="/login" className="underline">
            make yours
          </Link>
        </p>
      </div>
    </main>
  );
}
