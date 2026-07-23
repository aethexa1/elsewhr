// elsewhr — school data: the US Dept of Education College Scorecard, proxied.
// New file: app/api/school/route.ts
// Keeps the api.data.gov key server-side. Returns costs, size, admission, earnings, programs.
// Requires env var SCORECARD_API_KEY (free: https://api.data.gov/signup)

import { NextResponse } from "next/server";
import schoolData from "@/lib/schoolData.json";

type LocalSchool = {
  n: string; c: string | null; s: string | null; u: string | null; o: number | null;
  z: number | null; ti: number | null; to: number | null; np: number | null; me: number | null; ar: number | null;
};
const SCHOOLS = schoolData as LocalSchool[];

function findLocal(q: string): LocalSchool | null {
  const ql = q.toLowerCase();
  let best: LocalSchool | null = null;
  let bestScore = 4;
  for (const s of SCHOOLS) {
    const n = s.n.toLowerCase();
    const score = n === ql ? 0 : n.startsWith(ql) ? 1 : n.includes(ql) ? 2 : 4;
    if (score < bestScore) { best = s; bestScore = score; if (score === 0) break; }
  }
  return best;
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

    // ?list=1 -> just the known fields, for type-ahead
    if (url.searchParams.get("list")) {
      return NextResponse.json({ ok: true, known: Object.keys(FIELD_CIP) });
    }

    // field mode: every US school offering this program, cheapest in-state first
    if (field) {
      const key = process.env.SCORECARD_API_KEY;
      if (!key) return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });
      const cip = FIELD_CIP[field];
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
