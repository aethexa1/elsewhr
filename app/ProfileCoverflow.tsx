"use client";

// elsewhr — ProfileCoverflow: real faces, in the spotlight, one at a time.
// New file: app/ProfileCoverflow.tsx
// Adapted from an Originkit/Framer coverflow: Framer internals stripped,
// fed by real elsewhr profiles, dressed in ink borders and hard shadows.

import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react";

export type CoverSlide = { photo: string; name: string; line?: string };

const PERSPECTIVE = 1400;
const SCALE_STEP = 0.16;
const MAX_VISIBLE = 2;
const DEPTH = 200;
const DUR = 0.6;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function ProfileCoverflow({
  slides,
  cardWidth = 240,
  cardHeight = 300,
  autoplay = true,
  holdSeconds = 2.6,
}: {
  slides: CoverSlide[];
  cardWidth?: number;
  cardHeight?: number;
  autoplay?: boolean;
  holdSeconds?: number;
}) {
  const n = slides.length;
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive((a) => Math.max(0, Math.min(n - 1, a)));
  }, [n]);

  const lockRef = useRef(false);
  const lock = useCallback(() => {
    lockRef.current = true;
    window.setTimeout(() => { lockRef.current = false; }, Math.max(50, DUR * 1000));
  }, []);

  const step = useCallback((dir: number) => {
    if (lockRef.current) return;
    lock();
    setActive((a) => (((a + dir) % n) + n) % n);
  }, [n, lock]);

  const handleCardClick = useCallback((i: number) => {
    if (lockRef.current) return;
    lock();
    setActive((a) => (i === a ? (a + 1) % n : i));
  }, [n, lock]);

  useEffect(() => {
    if (!autoplay || n < 2) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setInterval(() => step(1), Math.max(1.2, holdSeconds) * 1000);
    return () => window.clearInterval(id);
  }, [autoplay, holdSeconds, n, step]);

  if (n === 0) return null;

  const transitionCss = `transform ${DUR}s ${EASE}, opacity ${DUR}s ${EASE}`;

  return (
    <div role="group"
      aria-roledescription="carousel"
      style={{ position: "relative", width: "100%", height: cardHeight + 44, display: "flex", alignItems: "center", justifyContent: "center", perspective: `${PERSPECTIVE}px`, overflow: "hidden", outline: "none" }}
    >
      <div style={{ position: "relative", width: cardWidth, height: cardHeight, transformStyle: "preserve-3d" }}>
        {slides.map((slide, i) => {
          let rel = i - active;
          if (rel > n / 2) rel -= n;
          if (rel < -n / 2) rel += n;
          const ax = Math.abs(rel);
          const visible = ax <= MAX_VISIBLE;
          const isActive = rel === 0;
          const sc = Math.max(0.4, 1 - ax * SCALE_STEP);
          const tx = rel * (cardWidth * 0.62);
          const tz = -ax * DEPTH;
          const ry = -rel * 10;
          const rz = rel * 3;

          const cardStyle: CSSProperties = {
            position: "absolute",
            left: "50%",
            top: "50%",
            width: cardWidth,
            height: cardHeight,
            borderRadius: 24,
            overflow: "hidden",
            border: "3px solid #1c1410",
            boxShadow: isActive ? "7px 7px 0 #1c1410" : "4px 4px 0 rgba(28,20,16,0.5)",
            transformOrigin: "center center",
            transform: `translate(-50%, -50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`,
            transition: transitionCss,
            opacity: visible ? 1 : 0,
            cursor: isActive ? "default" : "pointer",
            pointerEvents: visible ? "auto" : "none",
            backgroundColor: "#1c1410",
          };

          return (
            <div key={i} style={cardStyle} onClick={() => handleCardClick(i)} aria-label={slide.name} aria-hidden={!visible}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slide.photo} alt={slide.name} draggable={false}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", userSelect: "none" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(28,20,16,0.78) 100%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, pointerEvents: "none" }}>
                <span style={{ color: "#fff6ec", fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, lineHeight: "1.12em", letterSpacing: "-0.01em", whiteSpace: "pre-line", textShadow: "0 2px 10px rgba(0,0,0,0.45)" }}>
                  {slide.name}
                </span>
                {slide.line && (
                  <div style={{ color: "#c8f000", fontFamily: "ui-monospace, monospace", fontSize: 10.5, fontWeight: 700, marginTop: 4, textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
                    {slide.line}
                  </div>
                )}
              </div>
              <div style={{ position: "absolute", inset: 0, background: "#1c1410", opacity: isActive ? 0 : 0.35, transition: `opacity ${DUR}s ${EASE}`, pointerEvents: "none" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
