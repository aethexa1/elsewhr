// elsewhr — school data: the US Dept of Education College Scorecard, proxied.
// New file: app/api/school/route.ts
// Keeps the api.data.gov key server-side. Returns costs, size, admission, earnings, programs.
// Requires env var SCORECARD_API_KEY (free: https://api.data.gov/signup)

import { NextResponse } from "next/server";

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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    if (q.length < 3) {
      return NextResponse.json({ ok: false, error: "query too short" }, { status: 400 });
    }
    const key = process.env.SCORECARD_API_KEY;
    if (!key) {
      // honest signal so the UI can fall back to Wikidata-only
      return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });
    }

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
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
