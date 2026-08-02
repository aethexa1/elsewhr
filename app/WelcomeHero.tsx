"use client";

// elsewhr — the front door, v2: "the arrivals sky."
// Replace: app/WelcomeHero.tsx
// The guest hero finally tells the truth of the product: you got in — now you know people.
// Behind the words, a living R3F sky: travelers streaming along arcs toward a glowing
// destination. Abstract, premium at any population, fast on phones.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useLang } from "@/lib/i18n";

type Copy = {
  kicker: string; h1a: string; h1b: string; audiences: string[];
  sub: string; cta: string; whisper: string; loginLine: string;
};

const STRINGS: Record<string, Copy> = {
  en: {
    kicker: "for everyone starting somewhere new",
    h1a: "you got in.",
    h1b: "now you know people.",
    audiences: ["for the international admit", "for the first-year", "for the transfer", "for the new-in-town", "for the night-shift starter", "for anyone arriving alone"],
    sub: "your school, your city, your part-time life, your people — mapped before day one.",
    cta: "find your people — it's free",
    whisper: "knowing nobody is temporary here. that's the point.",
    loginLine: "already in? log in →",
  },
  es: {
    kicker: "para quien empieza en un lugar nuevo",
    h1a: "te aceptaron.",
    h1b: "ahora conoces gente.",
    audiences: ["para el admitido internacional", "para el de primer año", "para el transferido", "para el recién llegado", "para el del turno de noche", "para quien llega solo"],
    sub: "tu escuela, tu ciudad, tu trabajo de medio tiempo, tu gente — en el mapa antes del día uno.",
    cta: "encuentra a tu gente — es gratis",
    whisper: "no conocer a nadie es temporal aquí. de eso se trata.",
    loginLine: "¿ya estás dentro? inicia sesión →",
  },
  pt: {
    kicker: "para quem está começando em um lugar novo",
    h1a: "você entrou.",
    h1b: "agora você conhece gente.",
    audiences: ["para o admitido internacional", "para o calouro", "para o transferido", "para quem chegou agora", "para quem começa no turno da noite", "para quem chega sozinho"],
    sub: "sua escola, sua cidade, seu trabalho, sua gente — no mapa antes do primeiro dia.",
    cta: "encontre sua gente — é grátis",
    whisper: "não conhecer ninguém é temporário aqui. essa é a ideia.",
    loginLine: "já está dentro? entre →",
  },
  hi: {
    kicker: "हर उस इंसान के लिए जो कहीं नया शुरू कर रहा है",
    h1a: "दाख़िला मिल गया।",
    h1b: "अब लोग भी मिलेंगे।",
    audiences: ["विदेश जाने वाले के लिए", "फर्स्ट-ईयर के लिए", "ट्रांसफर वाले के लिए", "नए शहर वाले के लिए", "नाइट-शिफ्ट वाले के लिए", "अकेले पहुंचने वाले के लिए"],
    sub: "आपका स्कूल, आपका शहर, पार्ट-टाइम काम, आपके लोग — पहले दिन से पहले, नक्शे पर।",
    cta: "अपने लोग ढूंढो — मुफ़्त है",
    whisper: "किसी को न जानना यहाँ अस्थायी है। यही तो बात है।",
    loginLine: "पहले से अंदर? लॉग इन →",
  },
  pl: {
    kicker: "dla każdego, kto zaczyna w nowym miejscu",
    h1a: "dostałeś się.",
    h1b: "teraz znasz ludzi.",
    audiences: ["dla przyjętego z zagranicy", "dla pierwszoroczniaka", "dla przenoszącego się", "dla nowego w mieście", "dla zaczynających nocną zmianę", "dla każdego, kto przyjeżdża sam"],
    sub: "twoja szkoła, twoje miasto, praca dorywcza, twoi ludzie — na mapie przed pierwszym dniem.",
    cta: "znajdź swoich ludzi — za darmo",
    whisper: "nieznajomość nikogo jest tu tymczasowa. o to chodzi.",
    loginLine: "już jesteś? zaloguj się →",
  },
  fr: {
    kicker: "pour tous ceux qui commencent ailleurs",
    h1a: "tu es admis.",
    h1b: "maintenant tu connais des gens.",
    audiences: ["pour l'admis international", "pour le première année", "pour le transfert", "pour le nouveau en ville", "pour celui qui commence de nuit", "pour qui arrive seul"],
    sub: "ton école, ta ville, ton petit boulot, tes gens — sur la carte avant le jour un.",
    cta: "trouve tes gens — c'est gratuit",
    whisper: "ne connaître personne, ici, c'est temporaire. c'est le but.",
    loginLine: "déjà dedans ? connecte-toi →",
  },
};

/* ---------------- the sky ---------------- */

const N = 140;

type Traveler = { p0: THREE.Vector3; p1: THREE.Vector3; p2: THREE.Vector3; speed: number; phase: number; lime: boolean; scale: number };

function makeTravelers(): Traveler[] {
  const out: Traveler[] = [];
  for (let i = 0; i < N; i++) {
    const startY = -2.6 + Math.random() * 3.2;
    const p0 = new THREE.Vector3(-7 - Math.random() * 3, startY, -1 - Math.random() * 3);
    const p2 = new THREE.Vector3(4.6, 1.1, 0); // the destination glow
    const mid = new THREE.Vector3(
      (p0.x + p2.x) / 2 + (Math.random() - 0.5) * 2,
      Math.max(p0.y, p2.y) + 0.8 + Math.random() * 1.6,
      (p0.z + p2.z) / 2
    );
    out.push({
      p0, p1: mid, p2,
      speed: 0.05 + Math.random() * 0.075,
      phase: Math.random(),
      lime: Math.random() < 0.22,
      scale: 0.5 + Math.random() * 0.9,
    });
  }
  return out;
}

function quadPoint(t: number, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, out: THREE.Vector3) {
  const u = 1 - t;
  out.set(
    u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    u * u * a.z + 2 * u * t * b.z + t * t * c.z
  );
  return out;
}

function Sky({ still }: { still: boolean }) {
  const creamRef = useRef<THREE.InstancedMesh>(null);
  const limeRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);
  const travelers = useMemo(makeTravelers, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const ahead = useMemo(() => new THREE.Vector3(), []);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(({ clock }) => {
    const t = still ? 0 : clock.elapsedTime;
    let ci = 0, li = 0;
    for (const tr of travelers) {
      const prog = (tr.phase + t * tr.speed) % 1;
      quadPoint(prog, tr.p0, tr.p1, tr.p2, tmp);
      quadPoint(Math.min(1, prog + 0.02), tr.p0, tr.p1, tr.p2, ahead);
      dummy.position.copy(tmp);
      dummy.lookAt(ahead);
      const fade = prog > 0.92 ? (1 - prog) / 0.08 : 1; // dissolve into the glow
      dummy.scale.setScalar(tr.scale * fade);
      dummy.updateMatrix();
      if (tr.lime) { limeRef.current?.setMatrixAt(li++, dummy.matrix); }
      else { creamRef.current?.setMatrixAt(ci++, dummy.matrix); }
    }
    if (creamRef.current) { creamRef.current.count = ci; creamRef.current.instanceMatrix.needsUpdate = true; }
    if (limeRef.current) { limeRef.current.count = li; limeRef.current.instanceMatrix.needsUpdate = true; }
    if (glowRef.current) {
      const pulse = 1 + 0.1 * Math.sin(t * 2);
      glowRef.current.scale.setScalar(pulse);
    }
    if (ringRef.current) {
      const cycle = (t * 0.5) % 1;
      ringRef.current.scale.setScalar(0.6 + cycle * 1.5);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - cycle);
    }
    if (group.current) {
      group.current.rotation.y += ((pointer.current.x * 0.08) - group.current.rotation.y) * 0.05;
      group.current.rotation.x += ((-pointer.current.y * 0.05) - group.current.rotation.x) * 0.05;
    }
  });

  return (
    <group ref={group}>
      {/* travelers: little arrows of cream, some lime */}
      <instancedMesh ref={creamRef} args={[undefined, undefined, N]}>
        <coneGeometry args={[0.035, 0.16, 6]} />
        <meshBasicMaterial color="#fff6ec" transparent opacity={0.9} />
      </instancedMesh>
      <instancedMesh ref={limeRef} args={[undefined, undefined, N]}>
        <coneGeometry args={[0.04, 0.18, 6]} />
        <meshBasicMaterial color="#c8f000" />
      </instancedMesh>
      {/* the destination: a warm star with a breathing ring */}
      <mesh ref={glowRef} position={[4.6, 1.1, 0]}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshBasicMaterial color="#c8f000" />
      </mesh>
      <mesh position={[4.6, 1.1, 0]}>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial color="#fff6ec" transparent opacity={0.14} />
      </mesh>
      <mesh ref={ringRef} position={[4.6, 1.1, 0]}>
        <ringGeometry args={[0.5, 0.56, 48]} />
        <meshBasicMaterial color="#c8f000" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ---------------- the hero ---------------- */

export default function WelcomeHero() {
  const { lang } = useLang();
  const s = STRINGS[lang] || STRINGS.en;
  const [aud, setAud] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const id = setInterval(() => setAud((a) => (a + 1) % s.audiences.length), 2600);
    return () => clearInterval(id);
  }, [s.audiences.length]);

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "72vh" }}>
      {/* the sky lives behind everything */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <Canvas camera={{ position: [0, 0, 6.2], fov: 42 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true }}>
          <Sky still={still} />
        </Canvas>
      </div>

      <div className="relative z-10 max-w-[1100px] mx-auto px-5 pt-14 pb-10 md:pt-20">
        <p className="font-mono text-[11px] md:text-[12px] uppercase tracking-[0.22em] text-[#fff6ec]/85">{s.kicker}</p>
        <h1 className="mt-4 font-[Syne] font-extrabold leading-[0.95] text-[13vw] md:text-[86px] text-[#fff6ec] lowercase">
          {s.h1a}
          <br />
          <span className="text-[#c8f000]">{s.h1b}</span>
        </h1>
        <p key={aud} className="mt-5 font-[Syne] font-bold text-[18px] md:text-[22px] text-[#1c1410] inline-block bg-[#fff6ec] border-[3px] border-[#1c1410] rounded-full px-5 py-2 shadow-[5px_5px_0_rgba(28,20,16,0.9)] rise">
        {s.audiences[aud]}
        </p>
        <p className="mt-6 max-w-[560px] text-[16px] md:text-[18px] leading-relaxed text-[#fff6ec]/95">{s.sub}</p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link
            href="/login"
            className="inline-block px-7 py-4 rounded-2xl bg-[#c8f000] text-[#1c1410] font-[Syne] font-extrabold text-[16px] border-[3px] border-[#1c1410] shadow-[6px_6px_0_#1c1410] hover:translate-y-[-3px] hover:shadow-[8px_9px_0_#1c1410] active:translate-y-0 active:shadow-[3px_3px_0_#1c1410] transition-all duration-150"
          >
            {s.cta}
          </Link>
          <Link href="/login" className="font-mono text-[12.5px] font-bold text-[#fff6ec] underline underline-offset-4 hover:text-[#c8f000]">
            {s.loginLine}
          </Link>
        </div>
        <p className="mt-6 font-mono text-[11px] tracking-wide text-[#fff6ec]/70">{s.whisper}</p>
      </div>
    </section>
  );
}
