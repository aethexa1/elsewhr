// elsewhr — sparks: the bird suggests openers grounded in both profiles
// Create this file at: app/api/spark/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 15;

const recent = new Map<string, number[]>();
const LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;

const SYSTEM = `You write conversation openers for elsewhr, a network where people show real work instead of résumés.

You get two profiles: SENDER (writing) and RECIPIENT (receiving). Draft 3 short openers the sender could send.

Rules — absolute:
- Ground EVERY opener in something actually present in the profiles: a shared mindset tag, a specific work item or number of the recipient's, a fit between what the recipient seeks and what the sender has, shared location, or the recipient's learning/goal.
- NEVER invent facts, never flatter generically ("love your profile!" is banned), never open with "hi how are you".
- Write in the sender's casual first-person voice. Warm, specific, human. Each opener 1–2 sentences, under 160 characters.
- If the profiles share almost nothing, ground openers in the recipient's own work alone.
- Respond with ONLY valid JSON, no markdown fences: {"sparks":["...","...","..."]}`;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: userData, error: authError } = await anon.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const uid = userData.user.id;

    const now = Date.now();
    const calls = (recent.get(uid) ?? []).filter((t) => now - t < WINDOW_MS);
    if (calls.length >= LIMIT) {
      return NextResponse.json({ sparks: [] });
    }
    calls.push(now);
    recent.set(uid, calls);

    const { profileId } = await req.json();
    if (!profileId) return NextResponse.json({ sparks: [] });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ sparks: [] });

    const fields = "name, headline, location, seeking, mindset, learning, goal, artifacts";
    const [{ data: recipient }, { data: senderP }] = await Promise.all([
      anon.from("profiles").select(fields).eq("id", profileId).maybeSingle(),
      anon.from("profiles").select(fields).eq("user_id", uid).limit(1).maybeSingle(),
    ]);
    if (!recipient) return NextResponse.json({ sparks: [] });

    const strip = (p: Record<string, unknown> | null) =>
      p
        ? {
            name: p.name,
            headline: p.headline,
            location: p.location,
            seeking: p.seeking,
            mindset: p.mindset,
            learning: p.learning,
            goal: p.goal,
            work: Array.isArray(p.artifacts)
              ? (p.artifacts as { claim?: string; result?: string; field?: string }[])
                  .slice(0, 3)
                  .map((a) => ({ claim: a.claim, result: a.result, field: a.field }))
              : [],
          }
        : null;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 500,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `SENDER:\n${JSON.stringify(strip(senderP))}\n\nRECIPIENT:\n${JSON.stringify(strip(recipient))}`,
          },
        ],
      }),
    });

    if (!r.ok) return NextResponse.json({ sparks: [] });

    const data = await r.json();
    const text: string =
      data?.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      const sparks = Array.isArray(parsed.sparks)
        ? parsed.sparks.filter((s: unknown) => typeof s === "string").slice(0, 3)
        : [];
      return NextResponse.json({ sparks });
    } catch {
      return NextResponse.json({ sparks: [] });
    }
  } catch {
    return NextResponse.json({ sparks: [] });
  }
}
