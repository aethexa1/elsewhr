// elsewhr — the door: accept or ignore a knock, straight from the email
// Create this file at: app/api/knock/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 15;

const EXPIRY_DAYS = 7;
const SITE = "https://elsewhr.vercel.app";

function esc(s: string): string {
  return s
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split("\n").join("<br/>");
}

function page(title: string, body: string): NextResponse {
  const html = `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} — elsewhr</title></head>
<body style="margin:0;background:#ff5d3b;font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
  <div style="max-width:440px;background:#fff6ec;border:3px solid #1c1410;border-radius:20px;box-shadow:8px 8px 0 #1c1410;padding:28px;color:#1c1410">
    <p style="font-size:22px;font-weight:800;margin:0 0 4px">elsewhr<span style="color:#c8f000;-webkit-text-stroke:1px #1c1410">.</span></p>
    <p style="font-size:18px;font-weight:800;margin:16px 0 8px">${title}</p>
    <p style="font-size:14px;line-height:1.55;margin:0">${body}</p>
    <p style="margin:20px 0 0"><a href="${SITE}" style="color:#6b4eff;font-weight:bold;font-size:13px">back to elsewhr &#8594;</a></p>
  </div>
</body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  }) as NextResponse;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || "";
    const action = url.searchParams.get("action") || "";

    if (!token || (action !== "accept" && action !== "ignore")) {
      return page("that link doesn't work", "It may be incomplete — try the buttons in the email again.");
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    if (!serviceKey || !resendKey) {
      return page("not configured", "Messaging isn't fully set up yet.");
    }
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    const { data: knock } = await admin
      .from("reach_requests")
      .select("id, sender_user_id, sender_profile_id, recipient_user_id, message, status, created_at")
      .eq("accept_token", token)
      .maybeSingle();

    if (!knock) {
      return page("that link doesn't work", "This knock doesn't exist anymore.");
    }
    if (knock.status === "accepted") {
      return page("already open", "You accepted this one — the message is in your inbox. Just reply to it.");
    }
    if (knock.status === "ignored") {
      return page("already ignored", "You ignored this knock. They were never told.");
    }

    const ageMs = Date.now() - new Date(knock.created_at).getTime();
    if (ageMs > EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
      await admin
        .from("reach_requests")
        .update({ status: "expired", responded_at: new Date().toISOString() })
        .eq("id", knock.id);
      return page("this knock expired", "It sat for more than a week. If they still matter to you, find them on elsewhr.");
    }

    if (action === "ignore") {
      await admin
        .from("reach_requests")
        .update({ status: "ignored", responded_at: new Date().toISOString() })
        .eq("id", knock.id);
      return page("ignored", "Done. They will never know — no notification, nothing. The bird keeps secrets. &#128038;");
    }

    // --- accept: open the channel ---
    const { data: senderProfile } = await admin
      .from("profiles")
      .select("id, name, headline")
      .eq("id", knock.sender_profile_id)
      .maybeSingle();
    const { data: senderUser } = await admin.auth.admin.getUserById(knock.sender_user_id);
    const { data: recipientUser } = await admin.auth.admin.getUserById(knock.recipient_user_id);
    const senderEmail = senderUser?.user?.email;
    const recipientEmail = recipientUser?.user?.email;

    if (!senderEmail || !recipientEmail) {
      return page("something went wrong", "One side of this thread can't be reached right now. Try again later.");
    }

    const senderName = senderProfile ? esc(senderProfile.name) : "Someone on elsewhr";
    const senderLink = senderProfile ? SITE + "/p/" + String(senderProfile.id) : SITE;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;border:3px solid #1c1410;border-radius:16px;overflow:hidden">
        <div style="background:#ff5d3b;padding:16px 20px">
          <span style="font-size:20px;font-weight:800;color:#fff6ec">elsewhr<span style="color:#c8f000">.</span></span>
        </div>
        <div style="padding:20px;background:#fff6ec;color:#1c1410">
          <p style="margin:0 0 6px;font-size:15px">You opened the thread with <strong>${senderName}</strong>. Their message:</p>
          ${senderProfile?.headline ? `<p style="margin:0 0 14px;font-size:12px;color:#6b5e52">${esc(senderProfile.headline)}</p>` : ""}
          <div style="background:#ffffff;border:2px solid #1c1410;border-radius:12px;padding:14px;font-size:14px;line-height:1.5">${esc(knock.message)}</div>
          <p style="margin:16px 0 0;font-size:13px">
            <a href="${senderLink}" style="color:#6b4eff;font-weight:bold">See ${senderName}&#39;s real work &#8594;</a>
          </p>
          <p style="margin:14px 0 0;font-size:11px;color:#6b5e52">Reply to this email and it goes straight to them. The bird never shares your address. &#128038;</p>
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
        reply_to: senderEmail,
        subject: `Thread open: ${senderProfile?.name || "someone"} on elsewhr 🐦`,
        html,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("Resend error:", detail);
      return page("almost", "The thread couldn't open just now — try the accept button again in a minute.");
    }

    await admin
      .from("reach_requests")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", knock.id);

    return page("thread open", "Their message is in your inbox with a reply path attached — just hit reply. Addresses stay hidden on both sides. &#128038;");
  } catch (e) {
    console.error(e);
    return page("something went wrong", "Try the link again in a minute.");
  }
}
