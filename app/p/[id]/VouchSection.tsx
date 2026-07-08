"use client";

// elsewhr — vouching: accounts vouching for accounts (Trust Layer 2)
// Create this file at: app/p/[id]/VouchSection.tsx

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Vouch = {
  id: number;
  text: string;
  voucher_profile_id: number;
  voucher_user_id: string;
};

type VoucherInfo = {
  id: number;
  name: string;
  photo: string | null;
  accent: string | null;
};

export default function VouchSection({
  profileId,
  profileName,
  ownerUserId,
}: {
  profileId: number;
  profileName: string;
  ownerUserId: string | null;
}) {
  const [vouches, setVouches] = useState<Vouch[]>([]);
  const [vouchers, setVouchers] = useState<Record<number, VoucherInfo>>({});
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [viewerProfileId, setViewerProfileId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: vs } = await supabase
      .from("vouches")
      .select("id, text, voucher_profile_id, voucher_user_id")
      .eq("profile_id", profileId)
      .order("id", { ascending: true });

    const list = (vs ?? []) as Vouch[];
    setVouches(list);

    const ids = [...new Set(list.map((v) => v.voucher_profile_id))];
    if (ids.length > 0) {
      const { data: ps } = await supabase
        .from("profiles")
        .select("id, name, photo, accent")
        .in("id", ids);
      const map: Record<number, VoucherInfo> = {};
      (ps ?? []).forEach((p) => (map[p.id] = p as VoucherInfo));
      setVouchers(map);
    }
  }, [profileId]);

  useEffect(() => {
    load();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setViewerId(data.user.id);
      const { data: mine } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();
      if (mine) setViewerProfileId(mine.id);
    });
  }, [load]);

  const alreadyVouched = vouches.some((v) => v.voucher_user_id === viewerId);
  const isOwner = !!viewerId && viewerId === ownerUserId;
  const canVouch = !!viewerId && !!viewerProfileId && !isOwner && !alreadyVouched;

  async function submitVouch() {
    if (text.trim().length < 8) {
      setMsg("Say a little more — one honest sentence.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.from("vouches").insert({
      profile_id: profileId,
      voucher_profile_id: viewerProfileId,
      voucher_user_id: viewerId,
      text: text.trim(),
    });
    if (error) {
      setMsg(error.message);
    } else {
      setText("");
      setFormOpen(false);
      await load();
    }
    setBusy(false);
  }

  async function deleteMyVouch(id: number) {
    const sure = window.confirm("Remove your vouch?");
    if (!sure) return;
    await supabase.from("vouches").delete().eq("id", id);
    await load();
  }

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-[Syne] font-bold text-lg text-[#fff6ec]">
          Vouched by
        </h2>
        {canVouch && !formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            className="px-4 py-2 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-sm hover:translate-y-[-2px] transition-transform"
          >
            🐦 Vouch for {profileName.split(" ")[0]}
          </button>
        )}
      </div>

      {formOpen && (
        <div className="bg-[#fff6ec] rounded-2xl border-[3px] border-[#1c1410] p-4 mb-4">
          <p className="text-[13px] mb-2 text-[#6b5e52]">
            One honest sentence about their work or how they show up. Your name
            and face go on this — vouch only for what you&apos;ve actually seen.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder={`"${profileName.split(" ")[0]} actually ships — I've watched them build."`}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#1c1410] bg-white outline-none focus:border-[#6b4eff] text-[14px]"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={submitVouch}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-sm disabled:opacity-50"
            >
              {busy ? "Vouching…" : "Put my name on it"}
            </button>
            <button
              onClick={() => {
                setFormOpen(false);
                setMsg(null);
              }}
              className="px-4 py-2.5 rounded-xl border-2 border-[#1c1410] bg-white font-bold text-sm"
            >
              Cancel
            </button>
          </div>
          {msg && (
            <p className="mt-2 text-[13px] text-[#b03a3a] font-medium">{msg}</p>
          )}
        </div>
      )}

      {vouches.length === 0 && !formOpen ? (
        <p className="font-mono text-[12px] text-[#fff6ec]/70">
          no vouches yet — vouches here come from real elsewhr profiles, name
          and face attached.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {vouches.map((v) => {
            const who = vouchers[v.voucher_profile_id];
            const accent = who?.accent || "#6b4eff";
            return (
              <div
                key={v.id}
                className="bg-[#fff6ec] rounded-2xl border-[3px] border-[#1c1410] p-4 flex items-start gap-3"
              >
                {who?.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={who.photo}
                    alt={who?.name ?? "voucher"}
                    className="w-11 h-11 rounded-full object-cover border-2 flex-none"
                    style={{ borderColor: accent }}
                  />
                ) : (
                  <div
                    className="w-11 h-11 rounded-full text-[#fff6ec] flex items-center justify-center font-[Syne] font-extrabold text-lg flex-none"
                    style={{ background: accent }}
                  >
                    {who?.name?.[0] ?? "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[14.5px] leading-snug">
                    &ldquo;{v.text}&rdquo;
                  </p>
                  <p className="mt-1 text-[12px]">
                    —{" "}
                    {who ? (
                      <Link
                        href={`/p/${who.id}`}
                        className="font-bold underline"
                        style={{ color: accent === "#1c1410" ? "#6b4eff" : accent }}
                      >
                        {who.name}
                      </Link>
                    ) : (
                      <span className="font-bold">an elsewhr member</span>
                    )}
                    <span className="text-[#6b5e52]"> · real profile, staked on this</span>
                    {v.voucher_user_id === viewerId && (
                      <>
                        {" · "}
                        <button
                          onClick={() => deleteMyVouch(v.id)}
                          className="font-mono text-[11px] underline text-[#6b5e52] hover:text-[#b03a3a]"
                        >
                          remove
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
