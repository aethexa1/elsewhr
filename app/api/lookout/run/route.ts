// elsewhr — the lookout runs: the daily sweep, now a hunter.
// Replace: app/api/lookout/run/route.ts  ·  Vercel Cron.
// Every active lookout gets the full hunt: four open-web job nets in parallel
// plus elsewhr's own signals — one private note per person, links included.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { huntJobs, gatherSignals, composeNote, type Lookout } from "../hunt";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const secret = process.env.CRON_SECRET || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });
  const db = createClient(url, service);

  const { data: lookouts } = await db
    .from("lookouts")
    .select("user_id, watch, place, last_run")
    .eq("active", true)
    .limit(40);
  if (!lookouts || lookouts.length === 0) return NextResponse.json({ ok: true, ran: 0 });

  let wrote = 0;
  for (const lk of lookouts as Lookout[]) {
    const place = (lk.place || "").trim();
    if (!place) continue;
    const since = lk.last_run || new Date(Date.now() - 86400000).toISOString();
    try {
      const [webJobs, sig] = await Promise.all([
        huntJobs(lk.watch, place),
        gatherSignals(db, place, since),
      ]);
      const body = await composeNote(process.env.ANTHROPIC_API_KEY, lk, webJobs, sig);
      if (body) {
        await db.from("lookout_notes").insert({ user_id: lk.user_id, body });
        wrote++;
      }
    } catch { /* one person's storm never sinks the fleet */ }
    await db.from("lookouts").update({ last_run: new Date().toISOString() }).eq("user_id", lk.user_id);
  }
  return NextResponse.json({ ok: true, ran: lookouts.length, notes: wrote });
}
