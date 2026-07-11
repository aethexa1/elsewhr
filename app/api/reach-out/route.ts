// elsewhr — reach out: server-side mail delivery, addresses never exposed
// Create this file at: app/api/reach-out/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 15;

// per-sender rate limit (per server instance)
const recent = new Map<string, number[]>();
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000; // 5 messages per hour

export async function POST(req: Request) {
  try {
    // --- who is sending? ---
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

    // --- rate limit ---
    const now = Date.now();
    const calls = (recent.get(sender.id) ?? []).filter((t) => now - t < WINDOW_MS);
    if (calls.length >= LIMIT) {
      return NextResponse.json(
        { error: "The bird can only carry 5 messages an hour — try again soon." },
        { status: 429 }
      );
    }

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
      return NextResponse.json(
        { error: "Messaging isn't configured yet." },
        { status: 500 }
      );
    }

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

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
    const { data: targetUser } = await admin.auth.admin.getUserById(target.user_id);
    const recipientEmail = targetUser?.user?.email;
    if (!recipientEmail) {
      return NextResponse.json({ error: "That person can't be reached right now." }, { status: 400 });
    }

    // --- sender context (their profile makes the message credible) ---
    const { data: senderProfile } = await admin
      .from("profiles")
      .select("id, name, headline")
      .eq("user_id", sender.id)
      .limit(1)
      .maybeSingle();

    const senderName = senderProfile?.name || "Someone on elsewhr";
    const senderLink = senderProfile
      ? `https://elsewhr.vercel.app/p/${senderProfile.id}`
      : "https://elsewhr.vercel.app";

    const safeMsg = message
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;border:3px solid #1c1410;border-radius:16px;overflow:hidden">
        <div style="background:#ff5d3b;padding:16px 20px">
          <span style="font-size:20px;font-weight:800;color:#fff6ec">elsewhr<span style="color:#c8f000">.</span></span>
        </div>
        <div style="padding:20px;background:#fff6ec;color:#1c1410">
          <p style="margin:0 0 6px;font-size:15px"><strong>${senderName}</strong> reached out to you on elsewhr:</p>
          ${senderProfile?.headline ? `<p style="margin:0 0 14px;font-size:12px;color:#6b5e52">${senderProfile.headline}</p>` : ""}
          <div style="background:#ffffff;border:2px solid #1c1410;border-radius:12px;padding:14px;font-size:14px;line-height:1.5">${safeMsg}</div>
          <p style="margin:16px 0 0;font-size:13px">
            <a href="${senderLink}" style="color:#6b4eff;font-weight:bold">See ${senderName}&#39;s real work →</a>
          </p>
          <p style="margin:14px 0 0;font-size:11px;color:#6b5e52">Reply to this email and it goes straight to them. The bird never shares your address. 🐦</p>
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
        reply_to: sender.email,
        subject: `${senderName} reached out to you on elsewhr 🐦`,
        html,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("Resend error:", detail);
      return NextResponse.json(
        { error: "The bird couldn't deliver that — try again in a bit." },
        { status: 502 }
      );
    }

    calls.push(now);
    recent.set(sender.id, calls);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
