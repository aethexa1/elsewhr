// elsewhr — context-aware coaching + final review API route
// Replace file at: app/api/coach/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;

const MINDSET_LIST =
  "builder, curious, ships fast, night owl, team player, self-taught, detail-obsessed, big dreamer, disciplined, creative";

const COACH_SYSTEM = `You are the elsewhr profile coach. Given a person's name, one-line headline, and location, you produce tailored examples and hints for the rest of their profile.

elsewhr is a network where people show what they can actually DO — evidence, not résumés. NEVER inflated.

Rules — absolute:
- Everything must fit the person's stated background. If the headline says "McDonald's crew, 2 years", examples must be realistic fast-food work — not corporate abstractions.
- example.claim: one specific, active-voice accomplishment a person with this background could truthfully have, with a realistic number in it.
- example.result: the number/outcome alone (e.g. "200+ orders per rush").
- example.field: one-word category (Operations, Service, Sales, Engineering...).
- example.vouch: one short quoted sentence a real witness would say, ending with an em-dash and their role (e.g. "— shift manager"). The role must be someone who'd plausibly see this work.
- seeking: 2-3 short phrases for what people with this background often look for next. Realistic step-ups, not fantasies.
- mindsetLikely: 2-3 tags ONLY from this exact list that people with this background most often genuinely are: ${MINDSET_LIST}. Copy the tags verbatim.
- hints: one warm sentence each, in the voice of a friendly guide bird, tailored to this background. hints.photo suggests what kind of photo suits their work (uniform, workspace, tools — whatever fits). hints.work explains what "showing work" looks like for their kind of job. hints.seeking invites them to tap a suggestion or write their own. hints.learning and hints.goal nudge with a background-relevant example.
- Plain human language. Banned: "results-driven", "motivated", any buzzword.
- Keep every string short. No emoji.

Respond with ONLY valid JSON, no markdown fences, exactly this shape:
{"example":{"claim":"","result":"","field":"","vouch":""},"seeking":["",""],"mindsetLikely":["",""],"hints":{"photo":"","seeking":"","learning":"","goal":"","work":""}}`;

const REVIEW_SYSTEM = `You are the elsewhr bowerbird giving a final read of someone's draft profile before they publish. elsewhr profiles are evidence-first and NEVER inflated. The human decides everything — you only advise.

Rules — absolute:
- Be honest and kind. Speak directly to the person ("your", not "the user's").
- strongest: the single strongest thing in this profile and why it works, one sentence.
- gaps: up to 3 concrete, fixable gaps. Each one sentence, each actionable (e.g. "Your work tile has no number — even a rough one makes it proof."). If a work tile has no vouch, gently suggest asking someone. If the headline is vague, say what would sharpen it. If there are no real gaps, return fewer items or an empty array — do NOT invent problems.
- verdict: one warm closing sentence. If the profile is genuinely ready, say so plainly. Never pressure.
- NEVER suggest inflating, rounding up, or adding anything that didn't happen.
- Plain human language, no buzzwords, no emoji. Keep every string short.

Respond with ONLY valid JSON, no markdown fences, exactly this shape:
{"strongest":"","gaps":[""],"verdict":""}`;

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

    const body = await req.json();
    const mode = body.mode === "review" ? "review" : "coach";

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI is not configured yet." }, { status: 500 });
    }

    let system: string;
    let userContent: string;

    if (mode === "review") {
      const profile = body.profile ?? {};
      system = REVIEW_SYSTEM;
      userContent = `Here is the draft profile as JSON:\n\n${JSON.stringify(profile).slice(
        0,
        6000
      )}`;
    } else {
      const { name, headline, location } = body;
      if (!headline || typeof headline !== "string" || headline.trim().length < 3) {
        return NextResponse.json({ error: "No headline yet." }, { status: 400 });
      }
      system = COACH_SYSTEM;
      userContent = `Name: ${String(name ?? "").slice(0, 100)}\nHeadline: ${String(
        headline
      ).slice(0, 300)}\nLocation: ${String(location ?? "").slice(0, 100)}`;
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
        system,
        messages: [{ role: "user", content: userContent }],
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

    return mode === "review"
      ? NextResponse.json({ review: parsed })
      : NextResponse.json({ coach: parsed });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
