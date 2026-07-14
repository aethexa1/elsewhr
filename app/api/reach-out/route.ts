// elsewhr — reach out: the knock. Nothing is delivered without consent.
// Replaces app/api/reach-out/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 15;

const DAILY_LIMIT = 5;
const SITE = "https://elsewhr.vercel.app";

// html-escape without regex (paste-gremlin rule: plain string ops only)
function esc(s: string): string {
  return s
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split("\n").join("<br/>");
}

export async function POST(req: Request) {
  try {
    // --- who is knocking? ---
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Log in to reach out." }, { status: 401 });
    }

    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: userData, error: authError } = await anon.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: "Log in to reach out." }, { status: 401 });
    }
    const sender = userData.user;

    const { profileId, message } = await req.json();
    if (!profileId || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json({ error: "Write a real message first." }, { status: 400 });
    }
    if (message.length > 1000) {
      return NextResponse.json({ error: "Keep it under 1000 characters." }, { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    if (!serviceKey || !resendKey) {
      return NextResponse.json({ error: "Messaging isn't configured yet." }, { status: 500 });
    }
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    // --- you knock as somebody: a profile is required ---
    const { data: senderProfile } = await admin
      .from("profiles")
      .select("id, name, headline")
      .eq("user_id", sender.id)
      .limit(1)
      .maybeSingle();
    if (!senderProfile) {
      return NextResponse.json(
        { error: "Build your page first — that's how people know who's knocking." },
        { status: 400 }
      );
    }

    // --- recipient ---
    const { data: target } = await admin
      .from("profiles")
      .select("id, name, user_id")
      .eq("id", profileId)
      .maybeSingle();
    if (!target || !target.user_id) {
      return NextResponse.json({ error: "That profile can't receive messages." }, { status: 400 });
    }
    if (target.user_id === sender.id) {
      return NextResponse.json({ error: "That's your own profile." }, { status: 400 });
    }

    // --- blocks: if they've blocked you, the knock silently evaporates ---
    // (an error here would teach a harasser they've been blocked)
    const { data: blockRow } = await admin
      .from("blocks")
      .select("blocked_profile_id")
      .eq("blocker_user_id", target.user_id)
      .eq("blocked_profile_id", senderProfile.id)
      .maybeSingle();
    if (blockRow) {
      return NextResponse.json({ ok: true });
    }

    // --- rate limit with teeth: counted in the database, 5 knocks a day ---
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("reach_requests")
      .select("id", { count: "exact", head: true })
      .eq("sender_user_id", sender.id)
      .gte("created_at", dayAgo);
    if ((count ?? 0) >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: "The bird carries 5 knocks a day — yours are spent. Try tomorrow." },
        { status: 429 }
      );
    }

    // --- one pending knock per door ---
    const { data: existing } = await admin
      .from("reach_requests")
      .select("id")
      .eq("sender_user_id", sender.id)
      .eq("recipient_profile_id", target.id)
      .eq("status", "pending")
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: "You've already knocked — give them time to answer." },
        { status: 400 }
      );
    }

    // --- store the knock ---
    const { data: knock, error: insertError } = await admin
      .from("reach_requests")
      .insert({
        sender_user_id: sender.id,
        sender_profile_id: senderProfile.id,
        recipient_profile_id: target.id,
        recipient_user_id: target.user_id,
        message: message.trim(),
      })
      .select("accept_token")
      .single();
    if (insertError || !knock) {
      console.error("reach_requests insert:", insertError);
      return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }

    // --- the knock email: no reply path, two doors ---
    const { data: targetUser } = await admin.auth.admin.getUserById(target.user_id);
    const recipientEmail = targetUser?.user?.email;
    if (!recipientEmail) {
      return NextResponse.json({ error: "That person can't be reached right now." }, { status: 400 });
    }

    const senderName = esc(senderProfile.name);
    const senderLink = SITE + "/p/" + String(senderProfile.id);
    const acceptUrl = SITE + "/api/knock?token=" + knock.accept_token + "&action=accept";
    const ignoreUrl = SITE + "/api/knock?token=" + knock.accept_token + "&action=ignore";

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;border:3px solid #1c1410;border-radius:16px;overflow:hidden">
        <div style="background:#ff5d3b;padding:16px 20px">
          <span style="font-size:20px;font-weight:800;color:#fff6ec">elsewhr<span style="color:#c8f000">.</span></span>
        </div>
        <div style="padding:20px;background:#fff6ec;color:#1c1410">
          <p style="margin:0 0 6px;font-size:15px"><strong>${senderName}</strong> wants to reach out to you on elsewhr:</p>
          ${senderProfile.headline ? `<p style="margin:0 0 14px;font-size:12px;color:#6b5e52">${esc(senderProfile.headline)}</p>` : ""}
          <div style="background:#ffffff;border:2px solid #1c1410;border-radius:12px;padding:14px;font-size:14px;line-height:1.5">${esc(message.trim())}</div>
          <p style="margin:14px 0 0;font-size:13px">
            <a href="${senderLink}" style="color:#6b4eff;font-weight:bold">See ${senderName}&#39;s real work &#8594;</a>
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 0"><tr>
            <td><a href="${acceptUrl}" style="display:inline-block;background:#c8f000;color:#1c1410;font-weight:800;font-size:14px;text-decoration:none;border:2px solid #1c1410;border-radius:12px;padding:12px 18px">accept — open the thread</a></td>
            <td style="padding-left:10px"><a href="${ignoreUrl}" style="display:inline-block;background:#ffffff;color:#1c1410;font-weight:700;font-size:14px;text-decoration:none;border:2px solid #1c1410;border-radius:12px;padding:12px 18px">ignore</a></td>
          </tr></table>
          <p style="margin:16px 0 0;font-size:11px;color:#6b5e52">Nothing is shared unless you accept. If you ignore this, ${senderName} will never know. The bird never shares your address. &#128038;</p>
        </div>
      </div>`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "elsewhr bird <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `${senderProfile.name} wants to reach out on elsewhr 🐦`,
        html,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("Resend error:", detail);
      // knock stays stored; recipient just didn't get the email — mark expired so sender can retry later
      await admin
        .from("reach_requests")
        .update({ status: "expired", responded_at: new Date().toISOString() })
        .eq("accept_token", knock.accept_token);
      return NextResponse.json(
        { error: "The bird couldn't deliver that — try again in a bit." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
