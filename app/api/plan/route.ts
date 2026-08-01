// elsewhr — the week planner: school + work + rest + your things, balanced.
// New file: app/api/plan/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { school, work, sleep, activities, notes, lang } = (await req.json()) as {
      school?: string; work?: string; sleep?: string; activities?: string; notes?: string; lang?: string;
    };
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });

    const brief = [
      school ? "school/classes: " + school : "",
      work ? "work/target work hours: " + work : "",
      sleep ? "sleep preference: " + sleep : "",
      activities ? "activities they want in their life: " + activities : "",
      notes ? "notes: " + notes : "",
    ].filter(Boolean).join("\n");
    if (brief.length < 5) return NextResponse.json({ ok: false, error: "tell me a bit first" }, { status: 400 });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1400,
        system:
          "You are the elsewhr bird 🐦, planning a balanced week for a student/part-timer. " +
          "Respond ONLY with JSON, no markdown fences, matching exactly: " +
          '{"days":[{"day":"mon","blocks":[{"time":"9:00-12:00","what":"class","emoji":"📚"}]}],"tips":["…"]} ' +
          "Rules: 7 days (mon..sun), 3-6 blocks per day, realistic and kind — protect sleep, include rest and at least some of their activities, keep work within their target, add free/social time. " +
          "Short block labels (2-5 words). 2-3 tips, warm and practical, lowercase. " +
          (lang && lang !== "en" ? `Write all labels and tips in language code "${lang}".` : ""),
        messages: [{ role: "user", content: brief }],
      }),
    });
    if (!r.ok) {
      console.error("plan upstream:", (await r.text()).slice(0, 200));
      return NextResponse.json({ ok: false, error: "the bird is resting — try again" }, { status: 502 });
    }
    const data = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).filter((c) => c.type === "text" && c.text).map((c) => c.text).join("").trim()
      .replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
    try {
      const plan = JSON.parse(text);
      return NextResponse.json({ ok: true, plan });
    } catch {
      return NextResponse.json({ ok: false, error: "the bird mumbled — try again" }, { status: 502 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
