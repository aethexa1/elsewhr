// elsewhr — school data: the US Dept of Education College Scorecard, proxied.
// New file: app/api/school/route.ts
// Keeps the api.data.gov key server-side. Returns costs, size, admission, earnings, programs.
// Requires env var SCORECARD_API_KEY (free: https://api.data.gov/signup)

import { NextResponse } from "next/server";
import schoolData from "@/lib/schoolData.json";
import fieldCatalog from "@/lib/fieldCatalog.json";

type CatalogEntry = { t: string; c: string };
const CATALOG = fieldCatalog as CatalogEntry[];

type LocalSchool = {
  n: string; c: string | null; s: string | null; u: string | null; o: number | null;
  z: number | null; ti: number | null; to: number | null; np: number | null; me: number | null; ar: number | null;
};
const SCHOOLS = schoolData as LocalSchool[];

// THE matcher — built once, used everywhere. Handles:
//   "cal state"  -> every token prefixes a word (california ✓, state ✓)
//   "csudh"      -> acronym of the name's words
//   "dominguez"  -> word-prefix anywhere in the name
function matchSchools(q: string): LocalSchool[] {
  const ql = q.toLowerCase().trim();
  if (!ql) return [];
  const EXPAND: Record<string, string[]> = { uc: ["university", "california"], csu: ["california", "state", "university"], suny: ["state", "university", "new", "york"] };
  const STOP = new Set(["of", "the", "and", "at", "in", "for", "a"]);
  const tokens = ql.split(/\s+/).filter(Boolean).flatMap((t) => EXPAND[t] ?? [t]);
  const scored: { s: LocalSchool; sc: number }[] = [];
  for (const s of SCHOOLS) {
    const n = s.n.toLowerCase();
    const words = n.split(/[^a-z0-9]+/).filter(Boolean);
    const acronym = words.filter((w) => !STOP.has(w)).map((w) => w[0]).join("");
    let sc = 99;
    if (n === ql || acronym === ql) sc = 0;
    else if (n.startsWith(ql) || (tokens.length === 1 && acronym.startsWith(tokens[0]) && tokens[0].length >= 3)) sc = 1;
    else if (tokens.every((t) => words.some((w) => w.startsWith(t)))) sc = 2;
    else if (n.includes(ql)) sc = 3;
    if (sc < 99) scored.push({ s, sc });
  }
  scored.sort((a, b) => a.sc - b.sc || a.s.n.length - b.s.n.length);
  return scored.map(({ s }) => s);
}

function findLocal(q: string): LocalSchool | null {
  return matchSchools(q)[0] ?? null;
}

export const runtime = "nodejs";
export const maxDuration = 15;

const FIELDS = [
  "school.name",
  "school.city",
  "school.state",
  "school.school_url",
  "school.ownership",
  "latest.student.size",
  "latest.admissions.admission_rate.overall",
  "latest.cost.tuition.in_state",
  "latest.cost.tuition.out_of_state",
  "latest.cost.avg_net_price.overall",
  "latest.earnings.10_yrs_after_entry.median",
  "latest.programs.cip_4_digit.title",
].join(",");

// field -> CIP program codes (US Dept of Education classification)
const FIELD_CIP: Record<string, string> = {
  "cybersecurity": "11.1003",
  "cyber security": "11.1003",
  "information security": "11.1003",
  "computer science": "11.0701",
  "information technology": "11.0103",
  "data science": "30.7001",
  "software": "11.0201",
  "nursing": "51.3801",
  "business": "52.0201",
  "accounting": "52.0301",
  "finance": "52.0801",
  "marketing": "52.1401",
  "psychology": "42.0101",
  "criminal justice": "43.0104",
  "biology": "26.0101",
  "mechanical engineering": "14.1901",
  "electrical engineering": "14.1001",
  "civil engineering": "14.0801",
  "graphic design": "50.0409",
  "culinary": "12.0503",
  "welding": "48.0508",
  "hvac": "47.0201",
  "automotive": "47.0604",
  "education": "13.0101",
  "communications": "09.0101",
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const field = (url.searchParams.get("field") || "").trim().toLowerCase();

    // ?suggest= -> ranked school-name suggestions from the local database
    const sq = (url.searchParams.get("suggest") || "").trim();
    if (sq.length >= 2) {
      return NextResponse.json({
        ok: true,
        suggestions: matchSchools(sq).slice(0, 8).map((s) => ({ name: s.n, city: s.c, state: s.s })),
      });
    }

    // ?similar= -> schools like this one: same state, closest in size and kind
    const sim = (url.searchParams.get("similar") || "").trim();
    if (sim.length >= 2) {
      const me = findLocal(sim);
      if (!me) return NextResponse.json({ ok: true, similar: [] });
      const peers = SCHOOLS
        .filter((s) => s.n !== me.n && s.s === me.s)
        .map((s) => ({
          s,
          d:
            Math.abs((s.z ?? 0) - (me.z ?? 0)) / Math.max(me.z ?? 1, 1) +
            (s.o === me.o ? 0 : 0.75),
        }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 6)
        .map(({ s }) => ({ name: s.n, city: s.c, tuitionIn: s.ti }));
      return NextResponse.json({ ok: true, similar: peers });
    }

    // ?world=<place>&lat=&lon= -> global discovery, server-side: OSM around the point,
    // then Wikidata located-in, then name-match. The browser only ever talks to us.
    const wq = (url.searchParams.get("world") || "").trim();
    if (wq) {
      const lat = parseFloat(url.searchParams.get("lat") || "");
      const lon = parseFloat(url.searchParams.get("lon") || "");
      let world: { name: string; country: string }[] = [];
      // net 1: the map itself — campuses physically around the tap
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        try {
          const oq = '[out:json][timeout:8];(node["amenity"~"university|college"](around:25000,' + lat + "," + lon + ');way["amenity"~"university|college"](around:25000,' + lat + "," + lon + ');relation["amenity"~"university|college"](around:25000,' + lat + "," + lon + "););out center 60;";
          const ro = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "data=" + encodeURIComponent(oq),
            signal: AbortSignal.timeout(5000),
          });
          if (ro.ok) {
            const jo = (await ro.json()) as { elements?: { tags?: Record<string, string> }[] };
            const seen = new Set<string>();
            world = (jo.elements ?? [])
              .map((el) => (el.tags?.["name:en"] || el.tags?.name || "").trim())
              .filter((n) => { if (!n || seen.has(n.toLowerCase())) return false; seen.add(n.toLowerCase()); return true; })
              .slice(0, 30)
              .map((n) => ({ name: n, country: "on the map here" }));
          }
        } catch { /* next net */ }
      }
      // net 2: Wikidata — merges in whenever the map's catch is thin
      if (world.length < 5) {
        try {
          const rq = await fetch(
            "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=1&search=" + encodeURIComponent(wq),
            { headers: { "user-agent": "elsewhr/1.0 (student guide; contact via site)" }, signal: AbortSignal.timeout(4000) }
          );
          const jq = (await rq.json()) as { search?: { id: string }[] };
          const qid = jq.search?.[0]?.id;
          if (qid) {
            const sparql =
              "SELECT DISTINCT ?uLabel ?cLabel WHERE { ?u wdt:P31/wdt:P279* wd:Q38723 ; wdt:P131* wd:" + qid +
              ' . OPTIONAL { ?u wdt:P17 ?c . } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } LIMIT 40';
            const rs = await fetch("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(sparql), {
              headers: { accept: "application/sparql-results+json", "user-agent": "elsewhr/1.0 (student guide; contact via site)" },
              signal: AbortSignal.timeout(6000),
            });
            if (rs.ok) {
              const js = (await rs.json()) as { results?: { bindings?: { uLabel?: { value: string }; cLabel?: { value: string } }[] } };
              const seen = new Set(world.map((w) => w.name.toLowerCase()));
              const extra = (js.results?.bindings ?? [])
                .map((b) => ({ name: b.uLabel?.value || "", country: b.cLabel?.value || "" }))
                .filter((u) => u.name && !/^Q\d+$/.test(u.name) && !seen.has(u.name.toLowerCase()));
              world = [...world, ...extra].slice(0, 40);
            }
          }
        } catch { /* next net */ }
      }
      // net 3: the name-match floor — joins whenever the roster is still small
      if (world.length < 3) {
        try {
          const rw = await fetch("http://universities.hipolabs.com/search?name=" + encodeURIComponent(wq), { signal: AbortSignal.timeout(4000) });
          if (rw.ok) {
            const jw = (await rw.json()) as { name: string; country: string }[];
            const seen = new Set(world.map((w) => w.name.toLowerCase()));
            const extra = (Array.isArray(jw) ? jw : [])
              .map((u) => ({ name: u.name, country: u.country }))
              .filter((u) => u.name && !seen.has(u.name.toLowerCase()));
            world = [...world, ...extra].slice(0, 40);
          }
        } catch { /* the bird remains */ }
      }
      return NextResponse.json({ place: wq, world });
    }

    // ?city= -> every institution we know in that city: universities, colleges, all of it
    const cq = (url.searchParams.get("city") || "").trim().toLowerCase();
    if (cq) {
      const rows = SCHOOLS.filter((r) => (r.c || "").toLowerCase() === cq || (r.c || "").toLowerCase().startsWith(cq))
        .sort((a, b) => (b.z || 0) - (a.z || 0))
        .slice(0, 40)
        .map((r) => ({ name: r.n, city: r.c, state: r.s, ownership: r.o, tuitionIn: r.ti, size: r.z }));
      return NextResponse.json({ city: cq, schools: rows });
    }

    // ?list=1 -> the whole catalog for type-ahead: nice names first, then every official field of study
    if (url.searchParams.get("list")) {
      const known = [...new Set([...Object.keys(FIELD_CIP), ...CATALOG.map((e) => e.t)])];
      // codes ride along: the first two digits are the field's family (50=arts, 51=health, 11=computing…)
      const codes: Record<string, string> = {};
      for (const e of CATALOG) codes[e.t] = e.c;
      return NextResponse.json({ ok: true, known, codes });
    }

    // field mode: every US school offering this program, cheapest in-state first
    if (field) {
      const key = process.env.SCORECARD_API_KEY;
      if (!key) return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });
      let cip: string | undefined = FIELD_CIP[field];
      if (!cip) {
        const hit = CATALOG.find((e) => e.t === field) || CATALOG.find((e) => e.t.includes(field));
        if (hit) cip = hit.c;
      }
      if (!cip) {
        return NextResponse.json({ ok: true, field, known: Object.keys(FIELD_CIP), schools: null });
      }
      const api =
        "https://api.data.gov/ed/collegescorecard/v1/schools" +
        `?api_key=${key}` +
        `&latest.programs.cip_4_digit.code=${cip}` +
        "&fields=school.name,school.city,school.state,latest.student.size,latest.cost.tuition.in_state,latest.cost.tuition.out_of_state" +
        "&per_page=100";
      const r = await fetch(api);
      if (!r.ok) return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
      const data = (await r.json()) as { metadata?: { total?: number }; results?: Record<string, unknown>[] };
      const schools = (data.results ?? [])
        .map((s) => ({
          name: (s["school.name"] as string) ?? null,
          city: (s["school.city"] as string) ?? null,
          state: (s["school.state"] as string) ?? null,
          size: (s["latest.student.size"] as number) ?? null,
          tuitionIn: (s["latest.cost.tuition.in_state"] as number) ?? null,
          tuitionOut: (s["latest.cost.tuition.out_of_state"] as number) ?? null,
        }))
        .filter((s) => s.name)
        .sort((a, b) => (a.tuitionIn ?? 9e9) - (b.tuitionIn ?? 9e9));
      return NextResponse.json({ ok: true, field, total: data.metadata?.total ?? schools.length, schools: schools.slice(0, 30) });
    }
    if (q.length < 3) {
      return NextResponse.json({ ok: false, error: "query too short" }, { status: 400 });
    }
    // the local database answers first: no key, no external call, ever
    const local = findLocal(q);
    if (local) {
      let programs: string[] = [];
      const key = process.env.SCORECARD_API_KEY;
      if (key) {
        // optional garnish: program list from the public API, only if a key was ever configured
        try {
          const r = await fetch(
            "https://api.data.gov/ed/collegescorecard/v1/schools" +
            `?api_key=${key}&school.name=${encodeURIComponent(local.n)}` +
            "&fields=school.name,latest.programs.cip_4_digit.title&per_page=1"
          );
          if (r.ok) {
            const d = (await r.json()) as { results?: Record<string, unknown>[] };
            const raw = d.results?.[0]?.["latest.programs.cip_4_digit.title"];
            if (Array.isArray(raw)) programs = [...new Set((raw as unknown[]).map(String).filter(Boolean))].sort();
          }
        } catch { /* garnish only */ }
      }
      return NextResponse.json({
        ok: true,
        school: {
          name: local.n, city: local.c, state: local.s, url: local.u, ownership: local.o,
          size: local.z, admissionRate: local.ar, tuitionIn: local.ti, tuitionOut: local.to,
          netPrice: local.np, medianEarnings: local.me, programs,
        },
      });
    }
    return NextResponse.json({ ok: true, school: null });

    /* legacy API path retired — kept out of the request flow
    const api =
      "https://api.data.gov/ed/collegescorecard/v1/schools" +
      `?api_key=${key}` +
      `&school.name=${encodeURIComponent(q)}` +
      `&fields=${FIELDS}` +
      "&per_page=3";

    const r = await fetch(api);
    if (!r.ok) {
      const detail = await r.text();
      console.error("Scorecard error:", detail.slice(0, 300));
      return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
    }
    const data = (await r.json()) as { results?: Record<string, unknown>[] };
    const rows = data.results ?? [];
    if (rows.length === 0) {
      return NextResponse.json({ ok: true, school: null });
    }

    // prefer the result whose name most closely matches the query
    const ql = q.toLowerCase();
    rows.sort((a, b) => {
      const an = String(a["school.name"] || "").toLowerCase();
      const bn = String(b["school.name"] || "").toLowerCase();
      const as = an === ql ? 0 : an.startsWith(ql) ? 1 : an.includes(ql) ? 2 : 3;
      const bs = bn === ql ? 0 : bn.startsWith(ql) ? 1 : bn.includes(ql) ? 2 : 3;
      return as - bs;
    });
    const s = rows[0];

    const rawPrograms = s["latest.programs.cip_4_digit.title"];
    const programs = Array.isArray(rawPrograms)
      ? [...new Set((rawPrograms as unknown[]).map((p) => String(p)).filter(Boolean))].sort()
      : [];

    return NextResponse.json({
      ok: true,
      school: {
        name: s["school.name"] ?? null,
        city: s["school.city"] ?? null,
        state: s["school.state"] ?? null,
        url: s["school.school_url"] ?? null,
        ownership: s["school.ownership"] ?? null, // 1 public, 2 private nonprofit, 3 private for-profit
        size: s["latest.student.size"] ?? null,
        admissionRate: s["latest.admissions.admission_rate.overall"] ?? null,
        tuitionIn: s["latest.cost.tuition.in_state"] ?? null,
        tuitionOut: s["latest.cost.tuition.out_of_state"] ?? null,
        netPrice: s["latest.cost.avg_net_price.overall"] ?? null,
        medianEarnings: s["latest.earnings.10_yrs_after_entry.median"] ?? null,
        programs,
      },
    });
    */
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
