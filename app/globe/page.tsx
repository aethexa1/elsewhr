"use client";

// elsewhr — 🌐 the globe: spin the planet, find the people.
// New file: app/globe/page.tsx  ·  door on the home rack.
// Pins light wherever elsewhr people live or are heading. Click a pin → that world.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import type { GlobePin } from "./GlobeScene";

const GlobeScene = dynamic(() => import("./GlobeScene"), { ssr: false });

// a small atlas of the cities that matter to us — grows as the network does
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

const S: Record<string, { title: string; sub: string; back: string; empty: string }> = {
  en: { title: "the globe", sub: "spin the planet — lime pins are cities with elsewhr people. tap one to walk in.", back: "← back to elsewhr", empty: "pins light up as people join" },
  es: { title: "el globo", sub: "gira el planeta — los pines lima son ciudades con gente de elsewhr. toca uno para entrar.", back: "← volver a elsewhr", empty: "los pines se encienden cuando la gente se une" },
  pt: { title: "o globo", sub: "gire o planeta — pinos verdes são cidades com gente do elsewhr. toque para entrar.", back: "← voltar ao elsewhr", empty: "os pinos acendem conforme as pessoas chegam" },
  hi: { title: "ग्लोब", sub: "ग्रह घुमाओ — हरे पिन वो शहर हैं जहाँ elsewhr के लोग हैं। एक पर टैप करके अंदर जाओ।", back: "← elsewhr पर वापस", empty: "लोग जुड़ते हैं तो पिन जलते हैं" },
  pl: { title: "globus", sub: "zakręć planetą — limonkowe pinezki to miasta z ludźmi elsewhr. stuknij, by wejść.", back: "← wróć do elsewhr", empty: "pinezki zapalają się, gdy dołączają ludzie" },
  fr: { title: "le globe", sub: "fais tourner la planète — les épingles lime sont des villes avec des gens d'elsewhr. touche pour entrer.", back: "← retour à elsewhr", empty: "les épingles s'allument quand les gens arrivent" },
};

export default function GlobePage() {
  const { lang } = useLang();
  const s = S[lang] || S.en;
  const [rows, setRows] = useState<{ location: string | null; dest_place: string | null }[]>([]);

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

  const pins = useMemo<GlobePin[]>(() => {
    const byCity: Record<string, GlobePin> = {};
    for (const r of rows) {
      for (const text of [r.location, r.dest_place]) {
        const hit = findCity(text);
        if (!hit) continue;
        if (!byCity[hit.key]) byCity[hit.key] = { city: hit.key, lat: hit.lat, lon: hit.lon, count: 0 };
        byCity[hit.key].count += 1;
      }
    }
    return Object.values(byCity);
  }, [rows]);

  return (
    <main className="min-h-screen bg-[#ff5d3b] text-[#1c1410] flex flex-col px-4 py-6">
      <div className="w-full max-w-[900px] mx-auto flex items-center justify-between">
        <Link href="/" className="font-[Syne] font-extrabold text-2xl tracking-tight text-[#fff6ec]">elsewhr<span className="text-[#c8f000]">.</span></Link>
        <Link href="/" className="font-mono text-[11px] text-[#fff6ec]/80 underline underline-offset-4 hover:text-[#fff6ec]">{s.back}</Link>
      </div>
      <div className="w-full max-w-[900px] mx-auto mt-4">
        <h1 className="font-[Syne] font-extrabold text-3xl text-[#fff6ec] lowercase">🌐 {s.title}</h1>
        <p className="mt-1.5 text-[14px] text-[#fff6ec]/90 leading-snug">{s.sub}</p>
      </div>
      <div className="flex-1 w-full max-w-[900px] mx-auto mt-2" style={{ minHeight: "62vh" }}>
        <GlobeScene pins={pins} />
      </div>
      {pins.length === 0 && (
        <p className="text-center font-mono text-[11px] text-[#fff6ec]/70 pb-4">{s.empty}</p>
      )}
    </main>
  );
}
