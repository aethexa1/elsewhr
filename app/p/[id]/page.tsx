// elsewhr — individual profile page
// at: app/p/[id]/page.tsx

import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import OwnerBar from "./OwnerBar";
import VouchSection from "./VouchSection";
import ReachOut from "./ReachOut";
import ReportBlockActions from "@/app/ReportBlockActions";
import {
  BackLink,
  SampleBadge,
  LookingForLabel,
  LocationLine,
  WorkHeading,
  LearningLabel,
  GoalLabel,
  LivingFooter,
  NotFound,
} from "./ProfileLabels";

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
  user_id?: string | null;
  website?: string | null;
  name: string;
  photo?: string | null;
  headline: string;
  location: string;
  seeking?: string | null;
  mindset?: string[] | null;
  learning?: string | null;
  goal?: string | null;
  accent?: string | null;
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
        <NotFound />
      </main>
    );
  }

  const profile = data as Profile;
  const accent = profile.accent || "#6b4eff";
  const isSample = !profile.user_id;

  return (
    <main className="relative min-h-screen bg-[#ff5d3b] text-[#1c1410] flex justify-center px-4 py-8 overflow-hidden">
      <style>{`
        @keyframes rise { from { opacity:0; transform:translateY(26px);} to { opacity:1; transform:none;} }
        @keyframes drift1 { 0%,100% { transform:translate(0,0) scale(1);} 50% { transform:translate(40px,-30px) scale(1.08);} }
        @keyframes drift2 { 0%,100% { transform:translate(0,0) scale(1);} 50% { transform:translate(-50px,25px) scale(0.94);} }
        .rise { animation: rise .55s cubic-bezier(.2,.7,.3,1) both; }
        @media (prefers-reduced-motion: reduce) { .rise,.blob { animation:none !important; } }
      `}</style>
      <div aria-hidden className="blob absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#c8f000] opacity-[0.12] blur-3xl" style={{ animation: "drift1 15s ease-in-out infinite" }} />
      <div aria-hidden className="blob absolute bottom-10 -left-28 w-[26rem] h-[26rem] rounded-full bg-[#6b4eff] opacity-[0.13] blur-3xl" style={{ animation: "drift2 19s ease-in-out infinite" }} />
      <div className="relative w-full max-w-[560px]">
        {/* top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]"
          >
            elsewhr<span className="text-[#c8f000]">.</span>
          </Link>
          <BackLink />
        </div>

        {/* header */}
        <header className="rise bg-[#1c1410] text-[#fff6ec] rounded-3xl overflow-hidden border-[3px] border-[#1c1410] shadow-[8px_8px_0_rgba(28,20,16,0.35)]">
          <div style={{ background: accent }} className="h-2 w-full" />
          <div className="p-6">
          {isSample && <SampleBadge />}
          <div className="flex items-center gap-4">
            {profile.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photo}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover border-[3px] flex-none" style={{ borderColor: accent }}
              />
            )}
            <div>
              <h1 className="font-[Syne] font-extrabold text-3xl leading-none tracking-tight">
                {profile.name}
              </h1>
              <p className="font-semibold mt-2" style={{ color: accent === "#1c1410" ? "#c8f000" : accent }}>{profile.headline}</p>
            </div>
          </div>
          {profile.seeking && (
            <p className="text-[14px] mt-3 text-[#fff6ec]/90">
              <LookingForLabel />
              {profile.seeking}
            </p>
          )}
          {profile.mindset && profile.mindset.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile.mindset.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full text-[#fff6ec] text-[11px] font-medium" style={{ background: accent }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <LocationLine location={profile.location} />
          {profile.website && (
            <p className="mt-3">
              <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-3 py-1.5 rounded-xl border-2 border-[#c8f000] text-[#c8f000] font-mono text-[12px] hover:bg-[#c8f000] hover:text-[#1c1410] transition-colors"
              >
                🔗 {profile.website.replace("https://", "").replace("http://", "")}
              </a>
            </p>
          )}
          </div>
        </header>

        <OwnerBar profileId={profile.id} ownerUserId={profile.user_id ?? null} />

        <ReachOut
          profileId={profile.id}
          profileName={profile.name}
          ownerUserId={profile.user_id ?? null}
        />

        {/* safety: report + block (hidden for guests and on your own profile) */}
        <ReportBlockActions
          profileId={profile.id}
          profileOwnerId={profile.user_id ?? null}
        />

        {/* the work */}
        {profile.artifacts && profile.artifacts.length > 0 && (
          <>
            <WorkHeading />
            <div className="flex flex-col gap-4">
              {profile.artifacts.map((a, i) => (
                <article
                  key={i}
                  className="rise bg-[#fff6ec] rounded-3xl overflow-hidden border-[3px] border-[#1c1410] shadow-[8px_8px_0_rgba(28,20,16,0.9)]"
                  style={{ animationDelay: `${150 + i * 110}ms` }}
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

        <VouchSection
          profileId={profile.id}
          profileName={profile.name}
          ownerUserId={profile.user_id ?? null}
        />

        {/* learning + goal */}
        {(profile.learning || profile.goal) && (
          <div className="rise mt-4 bg-[#fff6ec] rounded-2xl border-[3px] border-[#1c1410] p-4 text-[14px]" style={{ animationDelay: "420ms" }}>
            {profile.learning && (
              <p>
                <LearningLabel />
                {profile.learning}
              </p>
            )}
            {profile.goal && (
              <p className="mt-1">
                <GoalLabel />
                {profile.goal}
              </p>
            )}
          </div>
        )}

        <LivingFooter />
      </div>
    </main>
  );
}
