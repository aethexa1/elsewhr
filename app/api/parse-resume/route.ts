// elsewhr — resume parsing API route
// Create this file at: app/api/parse-resume/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM = `You are the elsewhr profile assistant. You read a person's resume text and draft their elsewhr profile.

elsewhr is a network where people show what they can actually DO — skills, experience, mindset, work ethic — not a résumé. Profiles are evidence-first and NEVER inflated.

Rules — these are absolute:
- NEVER invent, exaggerate, or embellish. Only use what the resume actually says.
- If a number/result exists in the resume, surface it. If not, leave result fields empty — do NOT make numbers up.
- Write in plain, confident, human language. No corporate buzzwords ("results-driven", "motivated professional" are banned).
- headline: one punchy line of what they HAVE (their strongest real experience/skill). Style example: "Warehouse operations — 6 years. No degree. Started in fast food."
- seeking: infer ONLY if the resume states an objective; otherwise empty string.
- mindset: pick up to 4 tags ONLY from this list that the resume genuinely evidences: builder, curious, ships fast, night owl, team player, self-taught, detail-obsessed, big dreamer, disciplined, creative. If unsure, pick fewer.
- work: up to 3 of their strongest concrete accomplishments. claim = what they did (specific, active voice). result = the number/outcome IF stated. field = one-word category (e.g. Operations, Engineering, Sales). Leave image and vouch as empty strings.
- learning and goal: only if the resume mentions them; otherwise empty strings.

Respond with ONLY valid JSON, no markdown fences, exactly this shape:
{"name":"","headline":"","location":"","seeking":"","mindset":[],"learning":"","goal":"","work":[{"claim":"","image":"","result":"","field":"","vouch":""}]}`;

export async function POST(req: Request) {
  try {
    const { resume } = await req.json();

    if (!resume || typeof resume !== "string" || resume.trim().length < 40) {
      return NextResponse.json(
        { error: "Paste a bit more of your resume — at least a few lines." },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI is not configured yet." },
        { status: 500 }
      );
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
        max_tokens: 1200,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `Here is the resume text:\n\n${resume.slice(0, 12000)}`,
          },
        ],
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("Anthropic error:", detail);
      return NextResponse.json(
        { error: "The assistant had trouble reading that. Try again in a moment." },
        { status: 502 }
      );
    }

    const data = await r.json();
    const text: string =
      data?.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";

    // strip accidental code fences, then parse
    const clean = text.replace(/```json|```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error("Bad JSON from model:", clean.slice(0, 400));
      return NextResponse.json(
        { error: "Couldn't structure that resume — try pasting plain text." },
        { status: 502 }
      );
    }

    return NextResponse.json({ profile: parsed });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
