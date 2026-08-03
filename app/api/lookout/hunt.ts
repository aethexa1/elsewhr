// elsewhr — the lookout's hunting engine.
// New file: app/api/lookout/hunt.ts
// One sweep = internal signals + four open-web job nets, cast in PARALLEL:
// Remotive, Jobicy, Arbeitnow, Hacker News hiring — keyless, timeout-capped.
// Returns a written note (Claude Haiku when available) with real links inside.

import type { SupabaseClient } from "@supabase/supabase-js";

export type Lookout = { user_id: string; watch: string | null; place: string | null; last_run: string | null };
export type Job = { title: string; company: string; url: string; source: string };

const STOP = new Set(["a","an","the","or","and","for","in","at","my","me","of","to","work","job","jobs","part","time","part-time","full","full-time","near","around","looking","keeping","eye","on","current","field"]);

export function watchQuery(watch: string | null | undefined): string {
  const words = (watch || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w));
  return words.slice(0, 4).join(" ") || "student part time";
}

async function jfetch(url: string, ms = 4500): Promise<unknown> {
  const r = await fetch(url, { signal: AbortSignal.timeout(ms), headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

export async function huntJobs(watch: string | null | undefined, place: string): Promise<Job[]> {
  const q = watchQuery(watch);
  const enc = encodeURIComponent;
  const nets: Promise<Job[]>[] = [
    // Remotive — remote jobs, clean JSON
    jfetch("https://remotive.com/api/remote-jobs?search=" + enc(q) + "&limit=6").then((j) => {
      const d = j as { jobs?: { title: string; company_name: string; url: string }[] };
      return (d.jobs ?? []).slice(0, 5).map((x) => ({ title: x.title, company: x.company_name, url: x.url, source: "remotive" }));
    }),
    // Jobicy — remote, tag search
    jfetch("https://jobicy.com/api/v2/remote-jobs?count=6&tag=" + enc(q.split(" ")[0] || "assistant")).then((j) => {
      const d = j as { jobs?: { jobTitle: string; companyName: string; url: string }[] };
      return (d.jobs ?? []).slice(0, 4).map((x) => ({ title: x.jobTitle, company: x.companyName, url: x.url, source: "jobicy" }));
    }),
    // Arbeitnow — on-site + remote, searchable
    jfetch("https://www.arbeitnow.com/api/job-board-api?search=" + enc(q)).then((j) => {
      const d = j as { data?: { title: string; company_name: string; url: string; location: string }[] };
      const pl = place.toLowerCase();
      const rows = d.data ?? [];
      const local = rows.filter((x) => (x.location || "").toLowerCase().includes(pl));
      return (local.length ? local : rows).slice(0, 4).map((x) => ({ title: x.title, company: x.company_name, url: x.url, source: "arbeitnow" }));
    }),
    // Hacker News hiring — fresh, technical
    jfetch("https://hn.algolia.com/api/v1/search_by_date?tags=story&query=" + enc("hiring " + q) + "&hitsPerPage=4").then((j) => {
      const d = j as { hits?: { title: string; url: string | null; objectID: string }[] };
      return (d.hits ?? [])
        .filter((h) => /hiring/i.test(h.title || ""))
        .slice(0, 3)
        .map((h) => ({ title: h.title, company: "via hacker news", url: h.url || "https://news.ycombinator.com/item?id=" + h.objectID, source: "hn" }));
    }),
  ];
  const settled = await Promise.allSettled(nets);
  const seen = new Set<string>();
  const out: Job[] = [];
  for (const s of settled) {
    if (s.status !== "fulfilled") continue;
    for (const job of s.value) {
      const k = (job.title + job.company).toLowerCase();
      if (!job.title || seen.has(k)) continue;
      seen.add(k);
      out.push(job);
    }
  }
  return out.slice(0, 7);
}

export async function gatherSignals(db: SupabaseClient, place: string, since: string) {
  const [ev, ppl] = await Promise.all([
    db.from("events").select("title, when_text, created_at").ilike("place", "%" + place + "%").gt("created_at", since).limit(10),
    db.from("profiles").select("name, dest_place, roommate, created_at").or(`dest_place.ilike.%${place}%,location.ilike.%${place}%`).gt("created_at", since).limit(10),
  ]);
  const events = ev.data ?? [];
  const people = ppl.data ?? [];
  return {
    events,
    people,
    jobs: events.filter((e) => /hiring|job|part[- ]?time|shift|work/i.test(e.title || "")),
    roomies: people.filter((p) => p.roommate),
  };
}

export async function composeNote(
  anthropicKey: string | undefined,
  lk: Lookout,
  webJobs: Job[],
  sig: Awaited<ReturnType<typeof gatherSignals>>
): Promise<string> {
  const place = (lk.place || "").trim();
  const jobLines = webJobs.map((j) => `${j.title} — ${j.company} → ${j.url}`).join("\n");
  const facts = [
    webJobs.length ? "FRESH JOBS FROM THE OPEN WEB:\n" + jobLines : "",
    sig.jobs.length ? "posts on elsewhr boards: " + sig.jobs.map((j) => j.title).join(" | ") : "",
    sig.events.length ? "new happenings: " + sig.events.map((e) => e.title).join(" | ") : "",
    sig.people.length ? "new people around " + place + ": " + sig.people.map((p) => p.name).join(", ") : "",
    sig.roomies.length ? "looking for roommates: " + sig.roomies.map((p) => p.name).join(", ") : "",
  ].filter(Boolean).join("\n");

  if (anthropicKey && facts) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          messages: [{
            role: "user",
            content:
              'You are a sharp personal job scout for one person. Their brief: "' + (lk.watch || "no brief — scout on their behalf, student-friendly work") +
              '". Their place: ' + place + ".\nWhat the sweep found:\n" + facts +
              "\nWrite ONE tight note (max 90 words, lowercase, warm but efficient, no greetings). Lead with the 2-3 BEST matching jobs, each as: title — company → URL (keep URLs exactly as given, on their own lines). Then one line for anything else notable. Only mention what's above.",
          }],
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const j = (await r.json()) as { content?: { text?: string }[] };
        const text = (j.content?.[0]?.text || "").trim();
        if (text) return text.slice(0, 900);
      }
    } catch { /* fall through to plain */ }
  }
  if (webJobs.length) {
    return ("fresh finds for you:\n" + webJobs.slice(0, 4).map((j) => `${j.title} — ${j.company} → ${j.url}`).join("\n")).slice(0, 900);
  }
  if (sig.events.length || sig.people.length) {
    return ("around " + place + " — " +
      (sig.jobs.length ? sig.jobs.length + " board post(s) · " : "") +
      (sig.events.length ? sig.events.length + " new happening(s) · " : "") +
      (sig.people.length ? sig.people.length + " new arrival(s)" : "")).slice(0, 500);
  }
  return "";
}
