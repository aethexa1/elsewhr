// elsewhr — sweep now: the lookout hunts on demand.
// New file: app/api/lookout/sweep/route.ts
// The user taps once; the full hunt runs for them this second.
// Auth by their own token; rate-limited to one sweep per 10 minutes.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { huntJobs, gatherSignals, composeNote, type Lookout } from "../hunt";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });

  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return NextResponse.json({ ok: false, error: "sign in" }, { status: 401 });
  const asUser = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
  const { data: udata } = await asUser.auth.getUser(jwt);
  const uid = udata?.user?.id;
  if (!uid) return NextResponse.json({ ok: false, error: "sign in" }, { status: 401 });

  const db = createClient(url, service);
  const { data: lk } = await db.from("lookouts").select("user_id, watch, place, last_run").eq("user_id", uid).maybeSingle();
  if (!lk || !(lk.place || "").trim()) {
    return NextResponse.json({ ok: false, error: "set a place first" }, { status: 400 });
  }
  if (lk.last_run && Date.now() - new Date(lk.last_run).getTime() < 10 * 60 * 1000) {
    return NextResponse.json({ ok: false, error: "cooling" }, { status: 429 });
  }

  const place = (lk.place as string).trim();
  const since = lk.last_run || new Date(Date.now() - 86400000).toISOString();
  const [webJobs, sig] = await Promise.all([
    huntJobs(lk.watch, place),
    gatherSignals(db, place, since),
  ]);
  let body = await composeNote(process.env.ANTHROPIC_API_KEY, lk as Lookout, webJobs, sig);
  if (!body) body = "swept just now — nothing new matched around " + place + ". the daily watch continues 🔭";
  await db.from("lookout_notes").insert({ user_id: uid, body });
  await db.from("lookouts").update({ last_run: new Date().toISOString() }).eq("user_id", uid);
  return NextResponse.json({ ok: true, found: webJobs.length });
}
