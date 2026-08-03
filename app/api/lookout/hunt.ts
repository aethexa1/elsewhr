// elsewhr — the lookout's hunting engine, v2: wider nets, kinds, more catch.
// Replace: app/api/lookout/hunt.ts
// Six nets in parallel — Remotive, Jobicy, Arbeitnow, The Muse (location-aware!),
// RemoteOK, HN hiring — plus Adzuna auto-joining when its free keys exist.
// Every job tagged by KIND. Notes carry up to eight grouped finds.

import type { SupabaseClient } from "@supabase/supabase-js";

export type Lookout = { user_id: string; watch: string | null; place: string | null; last_run: string | null };
export type Job = { title: string; company: string; url: string; source: string; kind: string };

const STOP = new Set(["a","an","the","or","and","for","in","at","my","me","of","to","work","job","jobs","near","around","looking","keeping","eye","on","current","field","want","any"]);

export function watchQuery(watch: string | null | undefined): string {
  const words = (watch || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w));
  return words.slice(0, 4).join(" ") || "student assistant";
}

export function classify(title: string, remote: boolean): string {
  const t = title.toLowerCase();
  if (/intern/.test(t)) return "internship";
  if (/part[- ]?time/.test(t)) return "part-time";
  if (/contract|freelance|temporary/.test(t)) return "contract";
  if (/junior|entry|assistant|associate|trainee/.test(t)) return "entry-level";
  if (/senior|lead|principal|head of|director|manager/.test(t)) return "senior";
  return remote ? "remote" : "on-site";
}

async function jfetch(url: string, ms = 4500, headers: Record<string, string> = {}): Promise<unknown> {
  const r = await fetch(url, { signal: AbortSignal.timeout(ms), headers: { accept: "application/json", ...headers } });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

function parseRss(xml: string): { title: string; link: string }[] {
  const items: { title: string; link: string }[] = [];
  const chunks = xml.split("<item>").slice(1);
  for (const c of chunks.slice(0, 12)) {
    const t = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/.exec(c)?.[1]?.trim() || "";
    const l = /<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/.exec(c)?.[1]?.trim() || "";
    if (t && l) items.push({ title: t, link: l });
  }
  return items;
}

async function tfetch(url: string, ms = 4500, headers: Record<string, string> = {}): Promise<string> {
  const r = await fetch(url, { signal: AbortSignal.timeout(ms), headers: { accept: "*/*", ...headers } });
  if (!r.ok) throw new Error(String(r.status));
  return r.text();
}

function wwrCategory(q: string): string {
  if (/design|graphic|ui|ux/.test(q)) return "remote-design-jobs";
  if (/develop|engineer|program|code|cyber|data/.test(q)) return "remote-programming-jobs";
  if (/market|content|social|seo/.test(q)) return "remote-marketing-jobs";
  if (/support|service|customer/.test(q)) return "remote-customer-support-jobs";
  return "remote-jobs";
}

function kwMatch(title: string, q: string): boolean {
  const t = title.toLowerCase();
  return q.split(" ").some((w) => w.length > 2 && t.includes(w));
}

export async function huntJobs(watch: string | null | undefined, place: string): Promise<Job[]> {
  const q = watchQuery(watch);
  const enc = encodeURIComponent;
  const nets: Promise<Job[]>[] = [
    // Remotive — remote, searchable
    jfetch("https://remotive.com/api/remote-jobs?search=" + enc(q) + "&limit=10").then((j) => {
      const d = j as { jobs?: { title: string; company_name: string; url: string }[] };
      return (d.jobs ?? []).slice(0, 8).map((x) => ({ title: x.title, company: x.company_name, url: x.url, source: "remotive", kind: classify(x.title, true) }));
    }),
    // Jobicy — remote, tagged
    jfetch("https://jobicy.com/api/v2/remote-jobs?count=8&tag=" + enc(q.split(" ")[0] || "assistant")).then((j) => {
      const d = j as { jobs?: { jobTitle: string; companyName: string; url: string }[] };
      return (d.jobs ?? []).slice(0, 6).map((x) => ({ title: x.jobTitle, company: x.companyName, url: x.url, source: "jobicy", kind: classify(x.jobTitle, true) }));
    }),
    // Arbeitnow — on-site + remote, place-filtered when possible
    jfetch("https://www.arbeitnow.com/api/job-board-api?search=" + enc(q)).then((j) => {
      const d = j as { data?: { title: string; company_name: string; url: string; location: string; remote: boolean }[] };
      const pl = place.toLowerCase();
      const rows = d.data ?? [];
      const local = rows.filter((x) => (x.location || "").toLowerCase().includes(pl));
      return (local.length ? local : rows).slice(0, 6).map((x) => ({ title: x.title, company: x.company_name, url: x.url, source: "arbeitnow", kind: classify(x.title, !!x.remote) }));
    }),
    // The Muse — takes a LOCATION: the local net
    jfetch("https://www.themuse.com/api/public/jobs?page=1&location=" + enc(place)).then((j) => {
      const d = j as { results?: { name: string; company?: { name: string }; refs?: { landing_page: string } }[] };
      return (d.results ?? [])
        .filter((x) => kwMatch(x.name || "", q) || true)
        .slice(0, 6)
        .map((x) => ({ title: x.name, company: x.company?.name || "", url: x.refs?.landing_page || "", source: "themuse", kind: classify(x.name, false) }))
        .filter((x) => x.url);
    }),
    // RemoteOK — high volume, keyword-filtered
    jfetch("https://remoteok.com/api", 5000, { "user-agent": "elsewhr-lookout/1.0" }).then((j) => {
      const rows = (Array.isArray(j) ? j : []) as { position?: string; company?: string; url?: string }[];
      return rows
        .filter((x) => x.position && kwMatch(x.position, q))
        .slice(0, 6)
        .map((x) => ({ title: x.position as string, company: x.company || "", url: x.url || "", source: "remoteok", kind: classify(x.position as string, true) }))
        .filter((x) => x.url);
    }),
    // Google News — the NEWSPAPERS: local hiring headlines around their place
    tfetch("https://news.google.com/rss/search?q=" + enc('"hiring" OR "jobs" ' + place) + "&hl=en").then((xml) => {
      return parseRss(xml)
        .filter((i) => /hiring|jobs|positions|recruit/i.test(i.title))
        .slice(0, 4)
        .map((i) => ({ title: i.title, company: "local news", url: i.link, source: "newspapers", kind: "hiring news" }));
    }),
    // WeWorkRemotely — the classic RSS board, category-guessed from the brief
    tfetch("https://weworkremotely.com/categories/" + wwrCategory(q) + ".rss").then((xml) => {
      return parseRss(xml)
        .filter((i) => kwMatch(i.title, q) || true)
        .slice(0, 5)
        .map((i) => {
          const parts = i.title.split(":");
          const company = parts.length > 1 ? parts[0].trim() : "";
          const title = (parts.length > 1 ? parts.slice(1).join(":") : i.title).trim();
          return { title, company, url: i.link, source: "wwr", kind: classify(title, true) };
        });
    }),
    // OPEN SOURCE — GitHub's living job registries, mined from the READMEs
    Promise.all([
      tfetch("https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md", 5000).catch(() =>
        tfetch("https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/dev/README.md", 5000)
      ),
      tfetch("https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/README.md", 5000).catch(() => ""),
    ]).then(([interns, grads]) => {
      const mine = (md: string, kind: string): Job[] => {
        const out: Job[] = [];
        for (const line of md.split("\n")) {
          if (!line.startsWith("|") || out.length >= 5) continue;
          const cells = line.split("|").map((c) => c.trim());
          if (cells.length < 4) continue;
          const company = cells[1].replace(/\*\*|\[|\]\(.*?\)/g, "").trim();
          const role = cells[2].replace(/\*\*/g, "").trim();
          const loc = (cells[3] || "").toLowerCase();
          const urlM = /\((https?:\/\/[^)]+)\)/.exec(cells[4] || "") || /\((https?:\/\/[^)]+)\)/.exec(cells[1] || "");
          if (!company || !role || /company|----/i.test(company)) continue;
          const hit = kwMatch(role, q) || loc.includes(place.toLowerCase());
          if (hit && urlM) out.push({ title: role, company, url: urlM[1], source: "github·open", kind });
        }
        return out;
      };
      return [...mine(interns, "internship"), ...mine(grads, "new-grad")];
    }),
    // HN hiring — fresh, technical
    jfetch("https://hn.algolia.com/api/v1/search_by_date?tags=story&query=" + enc("hiring " + q) + "&hitsPerPage=4").then((j) => {
      const d = j as { hits?: { title: string; url: string | null; objectID: string }[] };
      return (d.hits ?? [])
        .filter((h) => /hiring/i.test(h.title || ""))
        .slice(0, 3)
        .map((h) => ({ title: h.title, company: "via hacker news", url: h.url || "https://news.ycombinator.com/item?id=" + h.objectID, source: "hn", kind: "varies" }));
    }),
  ];
  // Adzuna joins automatically when its free keys exist — LOCAL listings, worldwide:
  // it sweeps several country indexes in parallel and keeps whichever answer.
  // (country list editable — Adzuna also serves de, fr, br, pl, au, ca, sg, za…)
  const aid = process.env.ADZUNA_APP_ID;
  const akey = process.env.ADZUNA_APP_KEY;
  if (aid && akey) {
    for (const cc of ["us", "in", "gb"]) {
      nets.push(
        jfetch("https://api.adzuna.com/v1/api/jobs/" + cc + "/search/1?app_id=" + aid + "&app_key=" + akey + "&what=" + enc(q) + "&where=" + enc(place) + "&results_per_page=6").then((j) => {
          const d = j as { results?: { title: string; company?: { display_name: string }; redirect_url: string }[] };
          return (d.results ?? []).slice(0, 6).map((x) => ({ title: x.title, company: x.company?.display_name || "", url: x.redirect_url, source: "adzuna·" + cc, kind: classify(x.title, false) }));
        })
      );
    }
  }
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
  // local sources first, then variety
  const localish = (x: Job) => x.source.startsWith("adzuna") || x.source === "themuse" || x.source === "arbeitnow" ? -1 : 0;
  out.sort((a, b) => localish(a) - localish(b));
  return out.slice(0, 18);
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
  const jobLines = webJobs.map((j) => `[${j.kind}] ${j.title} — ${j.company} → ${j.url}`).join("\n");
  const facts = [
    webJobs.length ? "FRESH JOBS (with kind tags):\n" + jobLines : "",
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
          max_tokens: 600,
          messages: [{
            role: "user",
            content:
              'You are a sharp personal job scout. Their brief: "' + (lk.watch || "no brief — student-friendly work") +
              '". Their place: ' + place + ".\nThe sweep found:\n" + facts +
              "\nWrite ONE note (max 220 words, lowercase, warm, efficient, no greetings). Structure: 'best fits' — the 4 strongest matches; 'also worth a look' — 3-4 more of DIFFERENT kinds; if any [hiring news] items exist, a final 'local hiring news' line or two with those headlines + links. Each item on its own line as: [kind] title — company → URL (URLs exactly as given). Close with one honest sentence about the mix. Mention only what's above.",
          }],
        }),
        signal: AbortSignal.timeout(9000),
      });
      if (r.ok) {
        const j = (await r.json()) as { content?: { text?: string }[] };
        const text = (j.content?.[0]?.text || "").trim();
        if (text) return text.slice(0, 1400);
      }
    } catch { /* fall through */ }
  }
  if (webJobs.length) {
    return ("fresh finds:\n" + webJobs.slice(0, 8).map((j) => `[${j.kind}] ${j.title} — ${j.company} → ${j.url}`).join("\n")).slice(0, 1400);
  }
  if (sig.events.length || sig.people.length) {
    return ("around " + place + " — " +
      (sig.jobs.length ? sig.jobs.length + " board post(s) · " : "") +
      (sig.events.length ? sig.events.length + " new happening(s) · " : "") +
      (sig.people.length ? sig.people.length + " new arrival(s)" : "")).slice(0, 500);
  }
  return "";
}
