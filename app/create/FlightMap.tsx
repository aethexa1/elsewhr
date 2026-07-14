"use client";

// elsewhr â FlightMap: the bird's globe. Pick a place; the world turns to meet you.
// New file: app/create/FlightMap.tsx
// Zero dependencies: orthographic projection on a 2D canvas. Idles completely at rest.

import { useEffect, useMemo, useRef } from "react";

const LAND: [number, number][][] = [
  [[-125,49],[-95,49],[-80,45],[-75,45],[-67,45],[-70,42],[-76,35],[-81,31],[-81,25],[-88,30],[-95,29],[-97,26],[-106,23],[-114,29],[-120,34],[-124,40],[-125,49]], // na_usa
  [[-130,55],[-125,49],[-95,49],[-80,45],[-65,45],[-60,47],[-55,52],[-65,60],[-80,68],[-95,70],[-110,70],[-125,70],[-135,69],[-140,60],[-130,55]], // na_canada
  [[-166,60],[-165,68],[-155,71],[-141,70],[-141,60],[-150,59],[-160,55],[-166,60]], // na_alaska
  [[-114,29],[-106,23],[-97,26],[-97,20],[-92,15],[-84,10],[-78,8],[-83,8],[-88,13],[-95,16],[-105,20],[-110,24],[-114,29]], // na_mexico
  [[-78,7],[-70,10],[-62,10],[-52,4],[-44,-2],[-35,-7],[-39,-13],[-40,-22],[-48,-28],[-53,-34],[-58,-39],[-65,-41],[-65,-47],[-68,-52],[-71,-54],[-73,-46],[-71,-37],[-71,-30],[-70,-18],[-76,-14],[-81,-6],[-80,0],[-78,7]], // sa
  [[-17,15],[-16,21],[-10,28],[-6,35],[3,37],[10,37],[20,32],[30,31],[34,28],[38,18],[43,11],[51,12],[46,-1],[40,-11],[36,-19],[33,-26],[27,-33],[20,-34],[17,-30],[12,-18],[9,-7],[9,2],[6,4],[-8,4],[-13,8],[-17,15]], // africa
  [[-9,37],[-9,43],[-2,44],[-5,48],[-2,50],[3,53],[8,55],[8,57],[11,59],[18,60],[21,63],[25,66],[30,70],[40,68],[45,62],[48,56],[40,52],[35,47],[30,46],[28,42],[23,40],[18,40],[15,42],[12,44],[10,44],[6,43],[3,42],[-1,37],[-9,37]], // europe
  [[5,58],[5,62],[12,66],[18,70],[28,71],[30,70],[25,66],[21,63],[18,60],[11,59],[8,57],[5,58]], // scandinavia
  [[28,42],[35,47],[40,52],[48,56],[45,62],[40,68],[60,70],[80,73],[100,77],[120,73],[140,72],[160,70],[180,68],[180,65],[170,60],[162,58],[158,52],[142,53],[135,44],[129,42],[122,39],[120,32],[122,25],[115,22],[108,18],[105,10],[103,4],[100,8],[98,15],[94,17],[90,22],[88,21],[85,19],[80,13],[77,8],[74,15],[70,20],[66,25],[62,25],[57,25],[52,28],[48,30],[44,38],[40,41],[35,36],[30,36],[28,42]], // asia
  [[35,30],[43,12],[52,15],[58,22],[56,26],[48,30],[38,32],[35,30]], // arabia
  [[114,-22],[114,-34],[118,-35],[124,-33],[130,-32],[136,-35],[140,-38],[147,-38],[150,-37],[153,-30],[153,-25],[146,-19],[142,-11],[136,-12],[131,-12],[126,-14],[122,-17],[114,-22]], // australia
  [[-43,59],[-50,62],[-54,67],[-56,72],[-52,76],[-40,78],[-25,74],[-20,70],[-24,65],[-40,60],[-43,59]], // greenland
  [[-5,50],[-6,54],[-5,58],[-2,58],[0,53],[1,51],[-5,50]], // uk
  [[129,30],[132,33],[135,33.5],[138,34.5],[140.5,34.8],[141.5,37],[141,40],[140,42],[141.5,45.5],[145.5,44.5],[143,41.5],[142,38],[141,35.5],[138.5,36.5],[136,35.5],[132,34.8],[130,32],[129,30]], // japan
  [[95,5],[103,-1],[106,-6],[102,-5],[97,2],[95,5]], // sumatra
  [[109,0],[117,6],[119,1],[116,-3],[110,-3],[109,0]], // borneo
  [[44,-16],[50,-16],[50,-25],[45,-25],[43,-20],[44,-16]], // madagascar
  [[167,-46],[174,-41],[178,-37],[174,-39],[172,-44],[167,-46]], // nz
];

function pointInPoly(poly: [number, number][], lon: number, lat: number): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function isLand(lon: number, lat: number): boolean {
  for (const poly of LAND) if (pointInPoly(poly, lon, lat)) return true;
  return false;
}

const INK = "#1c1410";
const LIME = "#c8f000";

export default function FlightMap({
  lat,
  lon,
  label,
}: {
  lat: number | null;
  lon: number | null;
  label?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coordRef = useRef<HTMLSpanElement>(null);
  const rot = useRef({ lon: -100, lat: 25 });
  const target = useRef({ lon: -100, lat: 25 });
  const raf = useRef<number>(0);
  const settledAt = useRef<number>(0);
  const hasPin = useRef(false);

  // the world's dots, computed once
  const dots = useMemo(() => {
    const out: [number, number][] = [];
    for (let la = -60; la < 78; la += 3) {
      for (let lo = -180; lo < 180; lo += 3) {
        if (isLand(lo, la)) out.push([lo, la]);
      }
    }
    return out;
  }, []);

  useEffect(() => {
    if (lat == null || lon == null) return;
    target.current = { lon, lat: Math.max(-60, Math.min(75, lat)) };
    hasPin.current = true;
    settledAt.current = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      rot.current = { ...target.current };
      settledAt.current = performance.now();
    }
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dots]);

  function start() {
    cancelAnimationFrame(raf.current);
    const tick = (now: number) => {
      // shortest-path longitude approach
      let dLon = target.current.lon - rot.current.lon;
      while (dLon > 180) dLon -= 360;
      while (dLon < -180) dLon += 360;
      const dLat = target.current.lat - rot.current.lat;

      rot.current.lon += dLon * 0.085;
      rot.current.lat += dLat * 0.085;

      const settled = Math.abs(dLon) < 0.05 && Math.abs(dLat) < 0.05;
      if (settled && settledAt.current === 0) settledAt.current = now;

      draw(now);

      // keep animating through the pin pulse (2.4s), then fully idle
      if (!settled || (settledAt.current > 0 && now - settledAt.current < 2400)) {
        raf.current = requestAnimationFrame(tick);
      }
    };
    raf.current = requestAnimationFrame(tick);
  }

  function draw(now = 0) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssSize = canvas.clientWidth;
    if (canvas.width !== cssSize * dpr) {
      canvas.width = cssSize * dpr;
      canvas.height = cssSize * dpr;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssSize, cssSize);

    const cx = cssSize / 2;
    const cy = cssSize / 2;
    const R = cssSize * 0.42;
    const rl = (rot.current.lon * Math.PI) / 180;
    const rp = (rot.current.lat * Math.PI) / 180;
    const sinRp = Math.sin(rp);
    const cosRp = Math.cos(rp);

    // sphere outline
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();

    // land dots
    for (let i = 0; i < dots.length; i++) {
      const lam = (dots[i][0] * Math.PI) / 180 - rl;
      const phi = (dots[i][1] * Math.PI) / 180;
      const cosPhi = Math.cos(phi);
      const z = sinRp * Math.sin(phi) + cosRp * cosPhi * Math.cos(lam);
      if (z <= 0.02) continue;
      const x = cosPhi * Math.sin(lam);
      const y = cosRp * Math.sin(phi) - sinRp * cosPhi * Math.cos(lam);
      const r = 0.9 + 1.5 * z;
      ctx.globalAlpha = 0.28 + 0.72 * z;
      ctx.beginPath();
      ctx.arc(cx + x * R, cy - y * R, r, 0, Math.PI * 2);
      ctx.fillStyle = INK;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // the pin
    if (hasPin.current) {
      const lam = (target.current.lon * Math.PI) / 180 - rl;
      const phi = (target.current.lat * Math.PI) / 180;
      const cosPhi = Math.cos(phi);
      const z = sinRp * Math.sin(phi) + cosRp * cosPhi * Math.cos(lam);
      if (z > 0) {
        const px = cx + cosPhi * Math.sin(lam) * R;
        const py = cy - (cosRp * Math.sin(phi) - sinRp * cosPhi * Math.cos(lam)) * R;
        if (settledAt.current > 0 && now - settledAt.current < 2400) {
          const t = ((now - settledAt.current) % 800) / 800;
          ctx.beginPath();
          ctx.arc(px, py, 7 + t * 14, 0, Math.PI * 2);
          ctx.strokeStyle = LIME;
          ctx.globalAlpha = 0.8 * (1 - t);
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.beginPath();
        ctx.arc(px, py, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = LIME;
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    }

    // live coordinates in the ticker
    if (coordRef.current) {
      const la = rot.current.lat;
      const lo = ((rot.current.lon + 540) % 360) - 180;
      const laStr = Math.abs(la).toFixed(2) + "Â°" + (la >= 0 ? "N" : "S");
      const loStr = Math.abs(lo).toFixed(2) + "Â°" + (lo >= 0 ? "E" : "W");
      coordRef.current.textContent = laStr + " Â· " + loStr;
    }
  }

  return (
    <div className="mt-4 border-[3px] border-[#1c1410] rounded-2xl bg-white/60 p-4 overflow-hidden">
      <canvas ref={canvasRef} className="w-full aspect-square block" style={{ maxWidth: "320px", margin: "0 auto" }} />
      <p className="mt-2 text-center font-mono text-[11px] tracking-wide text-[#6b5e52]">
        <span ref={coordRef}>25.00Â°N Â· 100.00Â°W</span>
        {label ? <span className="text-[#1c1410] font-bold"> Â· {label}</span> : null}
      </p>
    </div>
  );
}
