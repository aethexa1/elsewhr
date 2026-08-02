"use client";

// elsewhr — 🌐 the globe v6: the real engine.
// Replace: app/globe/page.tsx  ·  MapLibre GL, globe projection, free open tiles.
// Every city on Earth labeled by the map itself; lime sonar marks OUR people.
// Zoom from space to street. Tap a sonar → walk into that city's world.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import "maplibre-gl/dist/maplibre-gl.css";

const ATLAS: Record<string, { lat: number; lon: number }> = {
  "rancho cucamonga": { lat: 34.106, lon: -117.593 },
  "fontana": { lat: 34.092, lon: -117.435 },
  "carson": { lat: 33.831, lon: -118.282 },
  "los angeles": { lat: 34.054, lon: -118.243 },
  "riverside": { lat: 33.98, lon: -117.375 },
  "irvine": { lat: 33.684, lon: -117.827 },
  "san francisco": { lat: 37.775, lon: -122.419 },
  "new york": { lat: 40.713, lon: -74.006 },
  "chicago": { lat: 41.878, lon: -87.63 },
  "seattle": { lat: 47.606, lon: -122.332 },
  "austin": { lat: 30.267, lon: -97.743 },
  "boston": { lat: 42.36, lon: -71.058 },
  "london": { lat: 51.507, lon: -0.128 },
  "toronto": { lat: 43.653, lon: -79.383 },
  "sydney": { lat: -33.869, lon: 151.209 },
  "dubai": { lat: 25.205, lon: 55.271 },
  "singapore": { lat: 1.352, lon: 103.82 },
  "ghaziabad": { lat: 28.669, lon: 77.454 },
  "noida": { lat: 28.536, lon: 77.391 },
  "delhi": { lat: 28.614, lon: 77.209 },
  "new delhi": { lat: 28.614, lon: 77.209 },
  "mumbai": { lat: 19.076, lon: 72.878 },
  "bangalore": { lat: 12.972, lon: 77.594 },
  "bengaluru": { lat: 12.972, lon: 77.594 },
  "hyderabad": { lat: 17.385, lon: 78.487 },
  "pune": { lat: 18.52, lon: 73.857 },
  "chennai": { lat: 13.083, lon: 80.27 },
  "kolkata": { lat: 22.573, lon: 88.364 },
  "jaipur": { lat: 26.912, lon: 75.787 },
  "lucknow": { lat: 26.847, lon: 80.946 },
  "warsaw": { lat: 52.23, lon: 21.012 },
  "krakow": { lat: 50.065, lon: 19.945 },
  "paris": { lat: 48.857, lon: 2.352 },
  "madrid": { lat: 40.417, lon: -3.704 },
  "mexico city": { lat: 19.433, lon: -99.133 },
  "sao paulo": { lat: -23.551, lon: -46.633 },
  "são paulo": { lat: -23.551, lon: -46.633 },
  "lagos": { lat: 6.524, lon: 3.379 },
  "nairobi": { lat: -1.292, lon: 36.822 },
  "manila": { lat: 14.6, lon: 120.984 },
  "tokyo": { lat: 35.677, lon: 139.65 },
  "seoul": { lat: 37.566, lon: 126.978 },
};

function findCity(text: string | null | undefined): { key: string; lat: number; lon: number } | null {
  if (!text) return null;
  const t = text.toLowerCase();
  for (const key of Object.keys(ATLAS)) {
    if (t.includes(key)) return { key, ...ATLAS[key] };
  }
  return null;
}

type Pin = { city: string; lat: number; lon: number; count: number };

const S: Record<string, { title: string; sub: string; back: string; empty: string }> = {
  en: { title: "the globe", sub: "the real one — spin it, zoom it. tap any city for its schools · lime sonar = elsewhr people.", back: "← back to elsewhr", empty: "sonar lights up as people join" },
  es: { title: "el globo", sub: "el de verdad — gíralo, acércate. sonar lima = ciudades con gente de elsewhr. toca para entrar.", back: "← volver a elsewhr", empty: "el sonar se enciende cuando la gente se une" },
  pt: { title: "o globo", sub: "o de verdade — gire, aproxime. sonar verde = cidades com gente do elsewhr. toque para entrar.", back: "← voltar ao elsewhr", empty: "o sonar acende conforme as pessoas chegam" },
  hi: { title: "ग्लोब", sub: "असली वाला — घुमाओ, ज़ूम करो। हरा सोनार = elsewhr के लोगों वाले शहर। टैप करके अंदर जाओ।", back: "← elsewhr पर वापस", empty: "लोग जुड़ते हैं तो सोनार जलता है" },
  pl: { title: "globus", sub: "ten prawdziwy — zakręć, przybliż. limonkowy sonar = miasta z ludźmi elsewhr. stuknij, by wejść.", back: "← wróć do elsewhr", empty: "sonar zapala się, gdy dołączają ludzie" },
  fr: { title: "le globe", sub: "le vrai — fais-le tourner, zoome. sonar lime = villes avec des gens d'elsewhr. touche pour entrer.", back: "← retour à elsewhr", empty: "le sonar s'allume quand les gens arrivent" },
};

export default function GlobePage() {
  const { lang } = useLang();
  const s = S[lang] || S.en;
  const router = useRouter();
  const mapDiv = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<{ remove: () => void } | null>(null);
  const markersRef = useRef<{ remove: () => void }[]>([]);
  const [rows, setRows] = useState<{ location: string | null; dest_place: string | null }[]>([]);
  const [schoolCities, setSchoolCities] = useState<Record<string, string>>({});
  const [panel, setPanel] = useState<{ city: string; loading: boolean; schools: { name: string; ownership: number | null; tuitionIn: number | null }[]; world: { name: string; country: string }[] } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("location, dest_place, user_id")
        .not("user_id", "is", null)
        .limit(200);
      if (data) setRows(data as { location: string | null; dest_place: string | null }[]);
    })();
  }, []);

  // destinations are school names — hop through our own API to their cities
  useEffect(() => {
    const dests = [...new Set(rows.map((r) => (r.dest_place || "").trim()).filter((d) => d.length > 2))];
    if (dests.length === 0) return;
    let alive = true;
    (async () => {
      const out: Record<string, string> = {};
      await Promise.all(
        dests.slice(0, 20).map(async (d) => {
          try {
            const r = await fetch("/api/school?q=" + encodeURIComponent(d));
            const j = await r.json();
            if (j?.school?.city) out[d] = j.school.city + (j.school.state ? ", " + j.school.state : "");
          } catch { /* unpinned then */ }
        })
      );
      if (alive) setSchoolCities(out);
    })();
    return () => { alive = false; };
  }, [rows]);

  const pins = useMemo<Pin[]>(() => {
    const byCity: Record<string, Pin> = {};
    for (const r of rows) {
      const destResolved = r.dest_place ? schoolCities[r.dest_place.trim()] || r.dest_place : null;
      for (const text of [r.location, destResolved]) {
        const hit = findCity(text);
        if (!hit) continue;
        if (!byCity[hit.key]) byCity[hit.key] = { city: hit.key, lat: hit.lat, lon: hit.lon, count: 0 };
        byCity[hit.key].count += 1;
      }
    }
    return Object.values(byCity);
  }, [rows, schoolCities]);

  // the real engine: MapLibre globe, open tiles, the whole labeled world
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!mapDiv.current || mapRef.current) return;
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !mapDiv.current) return;
      const map = new maplibregl.Map({
        container: mapDiv.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [40, 24],
        zoom: 1.6,
        attributionControl: { compact: true },
      });
      map.on("style.load", () => {
        try { map.setProjection({ type: "globe" }); } catch { /* flat is still the world */ }
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.on("click", async (e) => {
        const fts = map.queryRenderedFeatures(e.point);
        const placeFt = fts.find((f) => {
          const layer = (f.layer && f.layer.id) || "";
          const nm = f.properties && (f.properties["name:latin"] || f.properties.name);
          return nm && /place|city|town|village|state|country/i.test(layer);
        });
        const nm = placeFt && placeFt.properties ? String(placeFt.properties["name:latin"] || placeFt.properties.name) : null;
        if (!nm) return;
        setPanel({ city: nm, loading: true, schools: [], world: [] });
        try {
          const r = await fetch("/api/school?city=" + encodeURIComponent(nm));
          const j = await r.json();
          const us = Array.isArray(j.schools) ? j.schools : [];
          if (us.length > 0) {
            setPanel({ city: nm, loading: false, schools: us, world: [] });
          } else {
            // beyond the US file: elsewhr fetches the world itself, in the background
            try {
              const rw = await fetch("https://universities.hipolabs.com/search?name=" + encodeURIComponent(nm));
              const jw = await rw.json();
              const world = (Array.isArray(jw) ? jw : [])
                .slice(0, 25)
                .map((u: { name: string; country: string }) => ({ name: u.name, country: u.country }));
              setPanel({ city: nm, loading: false, schools: [], world });
            } catch {
              setPanel({ city: nm, loading: false, schools: [], world: [] });
            }
          }
        } catch {
          setPanel({ city: nm, loading: false, schools: [], world: [] });
        }
      });
      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // lime sonar where our people are
  useEffect(() => {
    (async () => {
      const map = mapRef.current as import("maplibre-gl").Map | null;
      if (!map || pins.length === 0) return;
      const maplibregl = (await import("maplibre-gl")).default;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = pins.map((p) => {
        const el = document.createElement("button");
        el.className = "ew-sonar";
        el.title = p.city;
        el.onclick = () => router.push("/w?place=" + encodeURIComponent(p.city));
        return new maplibregl.Marker({ element: el }).setLngLat([p.lon, p.lat]).addTo(map);
      });
    })();
  }, [pins, router]);

  return (
    <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex flex-col px-4 py-6">
      <style>{`
        .ew-sonar { position: relative; width: 18px; height: 18px; border-radius: 50%; background: #c8f000; border: 3px solid #1c1410; cursor: pointer; padding: 0; }
        .ew-sonar::after { content: ""; position: absolute; inset: -3px; border-radius: 50%; border: 3px solid #c8f000; animation: ew-ping 1.6s ease-out infinite; }
        @keyframes ew-ping { 0% { transform: scale(1); opacity: 0.9; } 100% { transform: scale(3); opacity: 0; } }
      `}</style>
      <div className="w-full max-w-[1100px] mx-auto flex items-center justify-between">
        <Link href="/" className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">elsewhr<span className="text-[#c8f000]">.</span></Link>
        <Link href="/" className="font-mono text-[11px] text-[#fff6ec]/80 underline underline-offset-4 hover:text-[#fff6ec]">{s.back}</Link>
      </div>
      <div className="w-full max-w-[1100px] mx-auto mt-4 mb-3">
        <h1 className="font-[Syne] font-extrabold text-3xl text-[#fff6ec] lowercase">🌐 {s.title}</h1>
        <p className="mt-1.5 text-[14px] text-[#fff6ec]/90 leading-snug">{s.sub}</p>
      </div>
      <div className="w-full max-w-[1100px] mx-auto rounded-3xl border-[3px] border-[#1c1410] overflow-hidden shadow-[8px_8px_0_rgba(28,20,16,0.9)]" style={{ height: "70vh" }}>
        <div ref={mapDiv} style={{ width: "100%", height: "100%" }} />
        {panel && (
          <div className="absolute top-3 left-3 bottom-3 w-[290px] max-w-[82vw] bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-2xl shadow-[6px_6px_0_rgba(28,20,16,0.9)] p-4 overflow-y-auto z-10">
            <div className="flex items-start justify-between gap-2">
              <p className="font-[Syne] font-extrabold text-[19px] leading-tight lowercase">📍 {panel.city}</p>
              <button type="button" onClick={() => setPanel(null)} className="font-bold text-[16px] leading-none px-1.5 py-0.5 rounded-md border-2 border-[#1c1410] bg-white hover:bg-[#c8f000]">×</button>
            </div>
            {panel.loading && <p className="mt-3 font-mono text-[11px] text-[#6b5e52]">looking up schools…</p>}
            {!panel.loading && panel.schools.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {panel.schools.map((sc) => (
                  <Link key={sc.name} href={"/w?place=" + encodeURIComponent(sc.name)}
                    className="block px-3 py-2 rounded-xl border-2 border-[#1c1410] bg-white hover:bg-[#c8f000]/40 transition-colors">
                    <p className="text-[12.5px] font-bold leading-snug">{sc.name}</p>
                    <p className="mt-0.5 text-[11px] text-[#6b5e52]">
                      {sc.ownership === 1 ? "🏛 public" : sc.ownership === 2 ? "🎓 private" : sc.ownership === 3 ? "💼 for-profit" : "🏫 college"}
                      {sc.tuitionIn ? " · $" + sc.tuitionIn.toLocaleString() : ""}
                    </p>
                  </Link>
                ))}
              </div>
            )}
            {!panel.loading && panel.schools.length === 0 && panel.world.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {panel.world.map((u) => (
                  <Link key={u.name} href={"/w?place=" + encodeURIComponent(u.name)}
                    className="block px-3 py-2 rounded-xl border-2 border-[#1c1410] bg-white hover:bg-[#c8f000]/40 transition-colors">
                    <p className="text-[12.5px] font-bold leading-snug">{u.name}</p>
                    <p className="mt-0.5 text-[11px] text-[#6b5e52]">🌍 university · {u.country}</p>
                  </Link>
                ))}
              </div>
            )}
            {!panel.loading && panel.schools.length === 0 && panel.world.length === 0 && (
              <p className="mt-3 text-[12.5px] text-[#6b5e52] leading-snug">nothing on file for this exact name — the bird still knows the place:</p>
            )}
            <div className="mt-3 flex flex-col gap-2">
              <Link href={"/w?place=" + encodeURIComponent(panel.city)}
                className="block text-center px-3 py-2 rounded-xl border-2 border-[#1c1410] bg-[#c8f000] font-bold text-[12.5px]">
                🐦 open {panel.city} — ask the bird
              </Link>
              <a href={"https://www.google.com/search?q=" + encodeURIComponent("universities and colleges in " + panel.city)}
                target="_blank" rel="noopener noreferrer"
                className="block text-center px-3 py-2 rounded-xl border-2 border-[#1c1410] bg-white font-bold text-[12.5px] hover:bg-[#c8f000]/40">
                🌍 all schools here ↗
              </a>
            </div>
          </div>
        )}
      </div>
      <div className="w-full max-w-[1100px] mx-auto mt-3 pb-2 flex flex-wrap justify-center gap-2">
        {pins.length === 0 ? (
          <p className="font-mono text-[11px] text-[#fff6ec]/70">{s.empty}</p>
        ) : (
          pins.map((p) => (
            <Link key={p.city} href={"/w?place=" + encodeURIComponent(p.city)}
              className="px-3.5 py-1.5 rounded-full border-2 border-[#1c1410] bg-[#fff6ec] text-[#1c1410] text-[12.5px] font-bold shadow-[3px_3px_0_rgba(28,20,16,0.9)] hover:bg-[#c8f000] transition-colors"
            >
              📍 {p.city}{p.count > 1 ? " · " + p.count : ""}
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
