"use client";

// elsewhr — Globe3D: the bird's globe in true 3D. react-three-fiber, as ordered.
// New file: app/create/Globe3D.tsx
// Same props as FlightMap — import it with next/dynamic (ssr: false) and it drops in.
// Ambient spin, drag-to-rotate, fly-to with landing zoom, lime atmosphere, real lighting.

import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const LAND: [number, number][][] = [
  [[-125,49],[-95,49],[-80,45],[-75,45],[-67,45],[-70,42],[-76,35],[-81,31],[-81,25],[-88,30],[-95,29],[-97,26],[-106,23],[-114,29],[-120,34],[-124,40],[-125,49]],
  [[-130,55],[-125,49],[-95,49],[-80,45],[-65,45],[-60,47],[-55,52],[-65,60],[-80,68],[-95,70],[-110,70],[-125,70],[-135,69],[-140,60],[-130,55]],
  [[-166,60],[-165,68],[-155,71],[-141,70],[-141,60],[-150,59],[-160,55],[-166,60]],
  [[-114,29],[-106,23],[-97,26],[-97,20],[-92,15],[-84,10],[-78,8],[-83,8],[-88,13],[-95,16],[-105,20],[-110,24],[-114,29]],
  [[-78,7],[-70,10],[-62,10],[-52,4],[-44,-2],[-35,-7],[-39,-13],[-40,-22],[-48,-28],[-53,-34],[-58,-39],[-65,-41],[-65,-47],[-68,-52],[-71,-54],[-73,-46],[-71,-37],[-71,-30],[-70,-18],[-76,-14],[-81,-6],[-80,0],[-78,7]],
  [[-17,15],[-16,21],[-10,28],[-6,35],[3,37],[10,37],[20,32],[30,31],[34,28],[38,18],[43,11],[51,12],[46,-1],[40,-11],[36,-19],[33,-26],[27,-33],[20,-34],[17,-30],[12,-18],[9,-7],[9,2],[6,4],[-8,4],[-13,8],[-17,15]],
  [[-9,37],[-9,43],[-2,44],[-5,48],[-2,50],[3,53],[8,55],[8,57],[11,59],[18,60],[21,63],[25,66],[30,70],[40,68],[45,62],[48,56],[40,52],[35,47],[30,46],[28,42],[23,40],[18,40],[15,42],[12,44],[10,44],[6,43],[3,42],[-1,37],[-9,37]],
  [[5,58],[5,62],[12,66],[18,70],[28,71],[30,70],[25,66],[21,63],[18,60],[11,59],[8,57],[5,58]],
  [[28,42],[35,47],[40,52],[48,56],[45,62],[40,68],[60,70],[80,73],[100,77],[120,73],[140,72],[160,70],[180,68],[180,65],[170,60],[162,58],[158,52],[142,53],[135,44],[129,42],[122,39],[120,32],[122,25],[115,22],[108,18],[105,10],[103,4],[100,8],[98,15],[94,17],[90,22],[88,21],[85,19],[80,13],[77,8],[74,15],[70,20],[66,25],[62,25],[57,25],[52,28],[48,30],[44,38],[40,41],[35,36],[30,36],[28,42]],
  [[35,30],[43,12],[52,15],[58,22],[56,26],[48,30],[38,32],[35,30]],
  [[114,-22],[114,-34],[118,-35],[124,-33],[130,-32],[136,-35],[140,-38],[147,-38],[150,-37],[153,-30],[153,-25],[146,-19],[142,-11],[136,-12],[131,-12],[126,-14],[122,-17],[114,-22]],
  [[-43,59],[-50,62],[-54,67],[-56,72],[-52,76],[-40,78],[-25,74],[-20,70],[-24,65],[-40,60],[-43,59]],
  [[-5,50],[-6,54],[-5,58],[-2,58],[0,53],[1,51],[-5,50]],
  [[129,30],[132,33],[135,33.5],[138,34.5],[140.5,34.8],[141.5,37],[141,40],[140,42],[141.5,45.5],[145.5,44.5],[143,41.5],[142,38],[141,35.5],[138.5,36.5],[136,35.5],[132,34.8],[130,32],[129,30]],
  [[95,5],[103,-1],[106,-6],[102,-5],[97,2],[95,5]],
  [[109,0],[117,6],[119,1],[116,-3],[110,-3],[109,0]],
  [[44,-16],[50,-16],[50,-25],[45,-25],[43,-20],[44,-16]],
  [[167,-46],[174,-41],[178,-37],[174,-39],[172,-44],[167,-46]],
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

// lat/lon on the unit sphere; lon 0 faces the camera at rotation zero
function toXYZ(lat: number, lon: number, r: number): [number, number, number] {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return [r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo)];
}

function Scene({ lat, lon, coordRef }: { lat: number | null; lon: number | null; coordRef: React.MutableRefObject<HTMLSpanElement | null> }) {
  const group = useRef<THREE.Group>(null);
  const camZ = useRef(3.3);
  const camZTarget = useRef(3.3);
  const rot = useRef({ x: (25 * Math.PI) / 180, y: (100 * Math.PI) / 180 });
  const target = useRef({ x: (25 * Math.PI) / 180, y: (100 * Math.PI) / 180 });
  const flying = useRef(false);
  const dragging = useRef(false);
  const reduced = useRef(false);
  const pinRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const settledAt = useRef(0);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // land as points, computed once
  const landPositions = useMemo(() => {
    const pts: number[] = [];
    for (let la = -60; la < 78; la += 2.4) {
      for (let lo = -180; lo < 180; lo += 2.4) {
        if (isLand(lo, la)) pts.push(...toXYZ(la, lo, 1.002));
      }
    }
    return new Float32Array(pts);
  }, []);

  const landGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(landPositions, 3));
    return g;
  }, [landPositions]);

  // fly to the chosen place
  useEffect(() => {
    if (lat == null || lon == null) return;
    const la = Math.max(-60, Math.min(75, lat));
    target.current = { x: (la * Math.PI) / 180, y: (-lon * Math.PI) / 180 };
    flying.current = true;
    settledAt.current = 0;
    camZTarget.current = 3.3; // pull back for the flight
    if (pinRef.current) {
      pinRef.current.position.set(...toXYZ(la, lon, 1.01));
      pinRef.current.visible = true;
    }
    if (reduced.current) {
      rot.current = { ...target.current };
      flying.current = false;
      camZ.current = 2.05;
      camZTarget.current = 2.05;
    }
  }, [lat, lon]);

  // drag wiring lives on the canvas element via events bubbled from the wrapper
  useEffect(() => {
    const el = document.getElementById("ew-globe3d");
    if (!el) return;
    let last = { x: 0, y: 0 };
    const down = (e: PointerEvent) => {
      dragging.current = true;
      flying.current = false;
      camZTarget.current = 3.3;
      last = { x: e.clientX, y: e.clientY };
      (e.target as Element)?.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      const k = 0.0055;
      rot.current.y += (e.clientX - last.x) * k;
      rot.current.x = Math.max(-1.3, Math.min(1.3, rot.current.x + (e.clientY - last.y) * k));
      last = { x: e.clientX, y: e.clientY };
    };
    const up = () => { dragging.current = false; };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, []);

  useFrame(({ camera, clock }) => {
    if (flying.current && !dragging.current) {
      let dy = target.current.y - rot.current.y;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      const dx = target.current.x - rot.current.x;
      rot.current.y += dy * 0.085;
      rot.current.x += dx * 0.085;
      if (Math.abs(dy) < 0.001 && Math.abs(dx) < 0.001) {
        flying.current = false;
        settledAt.current = clock.elapsedTime;
        camZTarget.current = 2.05; // the landing: push in on where you're going
      }
    } else if (!dragging.current && !reduced.current) {
      rot.current.y += 0.0009 * (camZ.current / 3.3); // ambient, slower when close
    }

    camZ.current += (camZTarget.current - camZ.current) * 0.055;
    camera.position.z = camZ.current;

    if (group.current) {
      group.current.rotation.x = rot.current.x;
      group.current.rotation.y = rot.current.y;
    }

    // pin pulse for a couple of beats after landing
    if (pulseRef.current) {
      const since = settledAt.current > 0 ? clock.elapsedTime - settledAt.current : 99;
      if (since < 2.4) {
        const t = (since % 0.8) / 0.8;
        pulseRef.current.visible = true;
        pulseRef.current.scale.setScalar(1 + t * 2.2);
        (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - t);
      } else {
        pulseRef.current.visible = false;
      }
    }

    // ticker
    if (coordRef.current) {
      const laDeg = (rot.current.x * 180) / Math.PI;
      const loDeg = ((-rot.current.y * 180) / Math.PI + 540) % 360 - 180;
      const laStr = Math.abs(laDeg).toFixed(2) + "°" + (laDeg >= 0 ? "N" : "S");
      const loStr = Math.abs(loDeg).toFixed(2) + "°" + (loDeg >= 0 ? "E" : "W");
      coordRef.current.textContent = laStr + " · " + loStr;
    }
  });

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[-3, 3, 5]} intensity={1.4} />
      <group ref={group}>
        {/* the body of the world */}
        <mesh>
          <sphereGeometry args={[0.995, 48, 48]} />
          <meshStandardMaterial color="#fff6ec" roughness={0.9} metalness={0} />
        </mesh>
        {/* the land */}
        <points geometry={landGeom}>
          <pointsMaterial color="#1c1410" size={0.02} sizeAttenuation />
        </points>
        {/* the pin */}
        <group ref={pinRef} visible={false}>
          <mesh>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshBasicMaterial color="#c8f000" />
          </mesh>
          <mesh ref={pulseRef} visible={false}>
            <ringGeometry args={[0.045, 0.055, 32]} />
            <meshBasicMaterial color="#c8f000" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
      {/* the atmosphere: a lime breath, drawn from inside out */}
      <mesh>
        <sphereGeometry args={[1.12, 48, 48]} />
        <meshBasicMaterial color="#c8f000" transparent opacity={0.10} side={THREE.BackSide} />
      </mesh>
    </>
  );
}

export default function Globe3D({
  lat,
  lon,
  label,
}: {
  lat: number | null;
  lon: number | null;
  label?: string;
}) {
  const coordRef = useRef<HTMLSpanElement | null>(null);
  const [webgl] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch { return false; }
  });

  if (!webgl) {
    // no WebGL, no drama: a still, honest fallback
    return (
      <div className="mt-4 border-[3px] border-[#1c1410] rounded-2xl bg-white/60 p-4 text-center">
        <p className="font-mono text-[11px] text-[#6b5e52]">🌍 {label || ""}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 border-[3px] border-[#1c1410] rounded-2xl bg-white/60 p-4 overflow-hidden">
      <div id="ew-globe3d" className="w-full aspect-square cursor-grab active:cursor-grabbing" style={{ maxWidth: "320px", margin: "0 auto", touchAction: "none" }}>
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3.3], fov: 42 }} gl={{ antialias: true, alpha: true }}>
          <Scene lat={lat} lon={lon} coordRef={coordRef} />
        </Canvas>
      </div>
      <p className="mt-2 text-center font-mono text-[11px] tracking-wide text-[#6b5e52]">
        <span ref={coordRef}>25.00°N · 100.00°W</span>
        {label ? <span className="text-[#1c1410] font-bold"> · {label}</span> : null}
      </p>
    </div>
  );
}
