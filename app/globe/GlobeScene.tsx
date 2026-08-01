"use client";

// elsewhr — the globe: the guide as a planet.
// New file: app/globe/GlobeScene.tsx
// Ink sphere, cream dot-grid, lime pins pulsing wherever elsewhr people are.
// Drag to spin; click a pin to enter that city's world. R3F only — no new deps.

import { useMemo, useRef, useState } from "react";
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
    for (let lat = -80; lat <= 80; lat += 8) {
      const steps = Math.max(8, Math.round(44 * Math.cos((lat * Math.PI) / 180)));
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
      <pointsMaterial color="#fff6ec" size={0.022} sizeAttenuation transparent opacity={0.55} />
    </points>
  );
}

function Pin({ pin, onGo }: { pin: GlobePin; onGo: (city: string) => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const pos = useMemo(() => latLonToVec(pin.lat, pin.lon, R * 1.01), [pin]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 1 + 0.25 * Math.sin(clock.elapsedTime * 3 + pin.lon);
    const base = 0.05 + Math.min(0.04, pin.count * 0.012);
    ref.current.scale.setScalar(base * pulse * (hover ? 1.7 : 1));
  });
  return (
    <mesh
      ref={ref}
      position={pos}
      onClick={(e) => { e.stopPropagation(); onGo(pin.city); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = "default"; }}
    >
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color={hover ? "#ffffff" : "#c8f000"} />
    </mesh>
  );
}

function Scene({ pins, onGo }: { pins: GlobePin[]; onGo: (c: string) => void }) {
  const group = useRef<THREE.Group>(null);
  const drag = useRef<{ on: boolean; x: number; y: number }>({ on: false, x: 0, y: 0 });
  const vel = useRef(0.15);

  useFrame((_, dt) => {
    if (!group.current) return;
    if (!drag.current.on) {
      group.current.rotation.y += vel.current * dt;
      vel.current += (0.15 - vel.current) * dt; // ease back to idle drift
    }
  });

  return (
    <group
      ref={group}
      rotation={[0.35, 0, 0]}
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
      <mesh>
        <sphereGeometry args={[R * 0.985, 48, 48]} />
        <meshBasicMaterial color="#1c1410" />
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
    <Canvas camera={{ position: [0, 0, 5.4], fov: 45 }} style={{ touchAction: "none" }}>
      <Scene pins={pins} onGo={(city) => router.push("/w?place=" + encodeURIComponent(city))} />
    </Canvas>
  );
}
