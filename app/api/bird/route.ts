// elsewhr — ask the bird: a grounded guide, not an oracle.
// New file: app/api/bird/route.ts
// Answers ONLY from the context the page hands it (people, happenings, stats, wiki).
// Beyond that it says it doesn't know. Uses the same ANTHROPIC_API_KEY as the coach.

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 25;

export async function POST(req: Request) {
  try {
    const { question, context } = (await req.json()) as { question?: string; context?: string };
    const q = (question || "").trim();
    if (q.length < 2 || q.length > 300) {
      return NextResponse.json({ ok: false, error: "ask a real question" }, { status: 400 });
    }
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });
    }
    const ctx = (context || "").slice(0, 6000);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 350,
        system:
          "You are the elsewhr bird 🐦 — a warm, brief guide on a page about one place (a school or city). " +
          "Answer ONLY from the CONTEXT below. If the answer isn't in the context, say you don't know yet and, " +
          "when it fits, suggest posting on the happenings board or saying hi to someone listed. " +
          "Never invent people, jobs, numbers, or facts. Lowercase, friendly, 1-3 short sentences. " +
          "Answer in the language the question is asked in.\n\nCONTEXT:\n" + ctx,
        messages: [{ role: "user", content: q }],
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("bird upstream:", detail.slice(0, 200));
      return NextResponse.json({ ok: false, error: "the bird is resting — try again" }, { status: 502 });
    }
    const data = (await r.json()) as { content?: { type: string; text?: string }[] };
    const answer = (data.content ?? [])
      .filter((c) => c.type === "text" && c.text)
      .map((c) => c.text)
      .join("\n")
      .trim();

    return NextResponse.json({ ok: true, answer: answer || "…the bird has nothing to say. odd." });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
