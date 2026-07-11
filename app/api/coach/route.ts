// elsewhr — context-aware coaching API route
// Create this file at: app/api/coach/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM = `You are the elsewhr profile coach. Given a person's name, one-line headline, and location, you produce tailored examples and hints for the rest of their profile.

elsewhr is a network where people show what they can actually DO — evidence, not résumés. NEVER inflated.

Rules — absolute:
- Everything must fit the person's stated background. If the headline says "McDonald's crew, 2 years", the example work must be realistic fast-food work (rush handling, register accuracy, training new crew) — not corporate abstractions.
- example.claim: one specific, active-voice accomplishment a person with this background could truthfully have, with a realistic number in it.
- example.result: the number/outcome alone (e.g. "200+ orders per rush").
- example.field: one-word category (Operations, Service, Sales, Engineering...).
- example.vouch: one short quoted sentence a real witness would say, ending with an em-dash and their role (e.g. "— shift manager"). The role must be someone who'd plausibly see this work.
- seeking: 2-3 short phrases for what people with this background often look for next. Realistic step-ups, not fantasies.
- hints: one warm sentence each, in the voice of a friendly guide bird, tailored to this background. hints.work explains what "showing work" looks like for their kind of job. hints.seeking invites them to tap a suggestion or write their own. hints.learning and hints.goal nudge with a background-relevant example.
- Plain human language. Banned: "results-driven", "motivated", any buzzword.
- Keep every string short. No emoji.

Respond with ONLY valid JSON, no markdown fences, exactly this shape:
{"example":{"claim":"","result":"","field":"","vouch":""},"seeking":["",""],"hints":{"seeking":"","learning":"","goal":"","work":""}}`;

export async function POST(req: Request) {
  try {
    // ---- auth: verify the caller is a logged-in elsewhr user ----
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    // ---- input ----
    const { name, headline, location } = await req.json();
    if (!headline || typeof headline !== "string" || headline.trim().length < 3) {
      return NextResponse.json({ error: "No headline yet." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI is not configured yet." }, { status: 500 });
    }

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 700,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `Name: ${String(name ?? "").slice(0, 100)}\nHeadline: ${String(
              headline
            ).slice(0, 300)}\nLocation: ${String(location ?? "").slice(0, 100)}`,
          },
        ],
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("Anthropic error:", detail);
      return NextResponse.json({ error: "Coach unavailable." }, { status: 502 });
    }

    const data = await r.json();
    const text: string =
      data?.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error("Bad JSON from coach:", clean.slice(0, 400));
      return NextResponse.json({ error: "Coach unavailable." }, { status: 502 });
    }

    return NextResponse.json({ coach: parsed });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
