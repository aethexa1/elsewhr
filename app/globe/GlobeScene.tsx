"use client";

// elsewhr — the globe v2: a planet that owns the room.
// Replace: app/globe/GlobeScene.tsx
// Bigger, brighter, haloed; pins you can actually see, with pulse rings.

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRouter } from "next/navigation";

export type GlobePin = { city: string; lat: number; lon: number; count: number };

const R = 2;

function latLonToVec(lat: number, lon: number, r: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function DotSphere() {
  const geom = useMemo(() => {
    const pts: number[] = [];
    for (let lat = -84; lat <= 84; lat += 5) {
      const steps = Math.max(10, Math.round(72 * Math.cos((lat * Math.PI) / 180)));
      for (let i = 0; i < steps; i++) {
        const lon = (i / steps) * 360 - 180;
        const v = latLonToVec(lat, lon, R);
        pts.push(v.x, v.y, v.z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <points geometry={geom}>
      <pointsMaterial color="#fff6ec" size={0.016} sizeAttenuation transparent opacity={0.16} />
    </points>
  );
}

function Pin({ pin, onGo }: { pin: GlobePin; onGo: (city: string) => void }) {
  const dot = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const pos = useMemo(() => latLonToVec(pin.lat, pin.lon, R * 1.012), [pin]);
  const outward = useMemo(() => pos.clone().normalize(), [pos]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (dot.current) {
      const pulse = 1 + 0.18 * Math.sin(t * 3 + pin.lon);
      const base = 0.085 + Math.min(0.05, pin.count * 0.02);
      dot.current.scale.setScalar(base * pulse * (hover ? 1.5 : 1));
    }
    if (ring.current) {
      const cycle = (t * 0.9 + pin.lon * 0.1) % 1;
      const s = 0.12 + cycle * 0.3;
      ring.current.scale.setScalar(s);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.75 * (1 - cycle);
    }
  });

  return (
    <group position={pos}>
      <mesh
        ref={dot}
        onClick={(e) => { e.stopPropagation(); onGo(pin.city); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = "default"; }}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={hover ? "#ffffff" : "#c8f000"} />
      </mesh>
      <mesh ref={ring} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), outward)}>
        <ringGeometry args={[0.85, 1, 32]} />
        <meshBasicMaterial color="#c8f000" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

const EARTH_SOURCES = [
  "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg",
  "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
  "https://cdn.jsdelivr.net/gh/vasturiano/three-globe/example/img/earth-blue-marble.jpg",
];

function Earth() {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    let cancelled = false;
    const tryLoad = (i: number) => {
      if (cancelled || i >= EARTH_SOURCES.length) return;
      loader.load(
        EARTH_SOURCES[i],
        (t) => {
          if (cancelled) return;
          t.colorSpace = THREE.SRGBColorSpace;
          setTex(t);
        },
        undefined,
        () => tryLoad(i + 1)
      );
    };
    tryLoad(0);
    return () => { cancelled = true; };
  }, []);
  return (
    <mesh rotation={[0, -Math.PI / 2, 0]}>
      <sphereGeometry args={[R * 0.985, 64, 64]} />
      {tex ? (
        <meshBasicMaterial map={tex} />
      ) : (
        <meshBasicMaterial color="#241a12" />
      )}
    </mesh>
  );
}

function Scene({ pins, onGo }: { pins: GlobePin[]; onGo: (c: string) => void }) {
  const group = useRef<THREE.Group>(null);
  const drag = useRef<{ on: boolean; x: number; y: number }>({ on: false, x: 0, y: 0 });
  const vel = useRef(0.22);

  useFrame((_, dt) => {
    if (!group.current) return;
    if (!drag.current.on) {
      group.current.rotation.y += vel.current * dt;
      vel.current += (0.22 - vel.current) * dt;
    }
  });

  return (
    <group
      ref={group}
      rotation={[0.32, 1.1, 0]}
      onPointerDown={(e) => { drag.current = { on: true, x: e.clientX, y: e.clientY }; }}
      onPointerUp={() => { drag.current.on = false; }}
      onPointerLeave={() => { drag.current.on = false; }}
      onPointerMove={(e) => {
        if (!drag.current.on || !group.current) return;
        const dx = e.clientX - drag.current.x;
        const dy = e.clientY - drag.current.y;
        drag.current.x = e.clientX;
        drag.current.y = e.clientY;
        group.current.rotation.y += dx * 0.005;
        group.current.rotation.x = Math.max(-0.9, Math.min(0.9, group.current.rotation.x + dy * 0.003));
        vel.current = dx * 0.05;
      }}
    >
      {/* the planet — the real one: night-earth continents, warm ink until it loads */}
      <Earth />
      {/* the halo: lime breath, cream haze */}
      <mesh>
        <sphereGeometry args={[R * 1.06, 48, 48]} />
        <meshBasicMaterial color="#c8f000" transparent opacity={0.1} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[R * 1.16, 48, 48]} />
        <meshBasicMaterial color="#fff6ec" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      <DotSphere />
      {pins.map((p) => (
        <Pin key={p.city} pin={p} onGo={onGo} />
      ))}
    </group>
  );
}

export default function GlobeScene({ pins }: { pins: GlobePin[] }) {
  const router = useRouter();
  return (
    <Canvas camera={{ position: [0, 0, 3.95], fov: 45 }} style={{ touchAction: "none", width: "100%", height: "100%" }}>
      <Scene pins={pins} onGo={(city) => router.push("/w?place=" + encodeURIComponent(city))} />
    </Canvas>
  );
}
