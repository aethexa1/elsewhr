"use client";

// elsewhr — profile orbit: your people, in motion.
// New file: app/ProfileOrbit.tsx  ·  adapted from the Originkit SpinImage reference.
// Real profiles only — faces (or accent initials) travel a tilted 3D ellipse.
// Hover pauses the sky; every face is a door.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type OrbitPerson = { id: number; name: string; photo?: string | null; accent?: string | null };

const B_RATIO = 0.35; // ellipse minor/major
const X_CURVE = 63; // 3D tilt, from the reference preset
const Y_CURVE = -47;
const REVS_PER_SEC = 0.05 * 3; // speed 3 on the reference's 0-20 scale

export default function ProfileOrbit({
  people,
  height = 300,
  discSize = 84,
}: {
  people: OrbitPerson[];
  height?: number;
  discSize?: number;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = useState({ W: 0, H: 0 });
  const [phi, setPhi] = useState(0);
  const phiRef = useRef(0);
  const hoverRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  // a sparse sky is a sad sky: repeat the real people until the orbit feels alive
  const items = useMemo(() => {
    const real = people.filter((p) => p.name);
    if (real.length === 0) return [];
    const out: OrbitPerson[] = [];
    while (out.length < Math.max(8, real.length)) out.push(...real);
    return out.slice(0, 16);
  }, [people]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (!r) return;
      const W = Math.round(r.width);
      const H = Math.round(r.height);
      if (W && H) setDims({ W, H });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!hoverRef.current) {
        phiRef.current += 2 * Math.PI * REVS_PER_SEC * dt;
        setPhi(phiRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const { W, H } = dims;
  if (items.length === 0) return null;

  const n = items.length;
  const a = (0.92 * W) / 2;
  const b = a * B_RATIO;
  const theta0 = W && H ? Math.atan2(H, W) : 0;
  const cosT = Math.cos(theta0);
  const sinT = Math.sin(theta0);
  const cx = W / 2;
  const cy = H / 2;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => { hoverRef.current = true; }}
      onMouseLeave={() => { hoverRef.current = false; }}
      style={{ position: "relative", width: "100%", height, overflow: "hidden", perspective: 1200 }}
      aria-label="people on elsewhr, orbiting"
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transform: `rotateY(${X_CURVE}deg) rotateX(${-Y_CURVE}deg)`,
        }}
      >
        {W > 0 &&
          items.map((p, i) => {
            const ang = (i / n) * Math.PI * 2 + phi;
            const ex = a * Math.cos(ang);
            const ey = b * Math.sin(ang);
            const x = ex * cosT - ey * sinT;
            const y = ex * sinT + ey * cosT;
            const depth = (Math.cos(ang) + 1) / 2;
            const sf = 0.6 + 0.8 * depth;
            const left = cx + x - discSize / 2;
            const top = cy + y - discSize / 2;
            return (
              <button
                key={i}
                type="button"
                onClick={() => router.push("/p/" + p.id)}
                title={p.name}
                aria-label={p.name}
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: discSize,
                  height: discSize,
                  transform: `rotateX(${Y_CURVE}deg) rotateY(${-X_CURVE}deg) scale(${sf})`,
                  zIndex: Math.round(y) + 1000,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid #1c1410",
                  boxShadow: "0 8px 24px rgba(28,20,16,0.35), 4px 4px 0 rgba(28,20,16,0.5)",
                  background: p.photo ? `url(${p.photo}) center/cover no-repeat` : (p.accent || "#6b4eff"),
                  cursor: "pointer",
                  padding: 0,
                  willChange: "left, top, transform",
                }}
              >
                {!p.photo && (
                  <span
                    style={{
                      display: "flex",
                      width: "100%",
                      height: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff6ec",
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 800,
                      fontSize: discSize * 0.42,
                    }}
                  >
                    {p.name[0]}
                  </span>
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
}
