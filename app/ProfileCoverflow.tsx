"use client";

// elsewhr — profile coverflow v2: the smooth-3D engine, wearing elsewhr's skin.
// Replace: app/ProfileCoverflow.tsx
// Same contract as v1 (slides: CoverSlide[]) — HomeShell needs no changes.
// Real faces only, always: the caller filters for user_id + photo.
// Active card is upright in the spotlight; neighbours tilt back and dim.
// Click a side card to bring it to centre; arrows work; autoplay drifts.

import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

export type CoverSlide = { photo?: string | null; accent?: string | null; name: string; line?: string; href?: string };

const PERSPECTIVE = 1600;
const SCALE_STEP = 0.16;
const MAX_VISIBLE = 2;
const DEPTH = 240; // preserve-3d paints by depth: centre nearest, neighbours behind

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
  const router = useRouter();
  const n = slides.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setActive((a) => Math.max(0, Math.min(Math.max(0, n - 1), a)));
  }, [n]);

  const DUR = 0.6;
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  const lockRef = useRef(false);
  const lock = useCallback(() => {
    lockRef.current = true;
    window.setTimeout(() => { lockRef.current = false; }, Math.max(50, DUR * 1000));
  }, []);

  const step = useCallback(
    (dir: number) => {
      if (lockRef.current || n < 2) return;
      lock();
      setActive((a) => (((a + dir) % n) + n) % n);
    },
    [n, lock]
  );

  const handleCardClick = useCallback(
    (i: number) => {
      if (lockRef.current) return;
      if (i === active) {
        const href = slides[i]?.href;
        if (href) router.push(href); // the centre card is a door
        return;
      }
      lock();
      setActive(i);
    },
    [active, lock, slides, router]
  );

  // autoplay drifts until the person touches it — their curiosity takes the wheel
  useEffect(() => {
    if (!autoplay || paused || n < 2) return;
    const id = window.setInterval(() => step(1), Math.max(1.2, holdSeconds) * 1000);
    return () => window.clearInterval(id);
  }, [autoplay, paused, n, step, holdSeconds]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); setPaused(true); step(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); setPaused(true); step(-1); }
    },
    [step]
  );

  if (n === 0) return null;

  const transitionCss = `transform ${DUR}s ${EASE}, opacity ${DUR}s ${EASE}`;

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="people on elsewhr"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={() => setPaused(true)}
      style={{
        position: "relative",
        width: "100%",
        height: cardHeight + 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: `${PERSPECTIVE}px`,
        overflow: "hidden",
        outline: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: cardWidth,
          height: cardHeight,
          transformStyle: "preserve-3d",
        }}
      >
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
          const rz = rel * 4;

          const cardStyle: CSSProperties = {
            position: "absolute",
            left: "50%",
            top: "50%",
            width: cardWidth,
            height: cardHeight,
            borderRadius: 22,
            overflow: "hidden",
            border: "3px solid #1c1410",
            boxShadow: isActive ? "8px 8px 0 rgba(28,20,16,0.9)" : "5px 5px 0 rgba(28,20,16,0.5)",
            transformStyle: "preserve-3d",
            transformOrigin: "center center",
            transform: `translate(-50%, -50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`,
            transition: transitionCss,
            opacity: visible ? 1 : 0,
            cursor: isActive ? (slide.href ? "pointer" : "default") : "pointer",
            pointerEvents: visible ? "auto" : "none",
            backgroundColor: "#1c1410",
          };

          return (
            <div
              key={slide.name + i}
              style={cardStyle}
              onClick={() => handleCardClick(i)}
              aria-label={slide.name}
              aria-hidden={!visible}
            >
              {!slide.photo && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: slide.accent || "#6b4eff",
                    color: "#fff6ec",
                    fontFamily: "Syne, sans-serif",
                    fontWeight: 800,
                    fontSize: cardHeight * 0.4,
                  }}
                >
                  {slide.name[0]}
                </div>
              )}
              {slide.photo && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={slide.photo}
                alt={slide.name}
                draggable={false}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  userSelect: "none",
                }}
              />
              )}

              {/* legibility gradient + name plate */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(28,20,16,0) 45%, rgba(28,20,16,0.78) 100%)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, pointerEvents: "none" }}>
                <p
                  style={{
                    color: "#fff6ec",
                    fontFamily: "Syne, sans-serif",
                    fontWeight: 800,
                    fontSize: 19,
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                    margin: 0,
                    textShadow: "0 2px 10px rgba(28,20,16,0.5)",
                  }}
                >
                  {slide.name}
                </p>
                {slide.line ? (
                  <p
                    style={{
                      color: "#c8f000",
                      fontWeight: 700,
                      fontSize: 12.5,
                      lineHeight: 1.2,
                      margin: "4px 0 0",
                      textShadow: "0 1px 8px rgba(28,20,16,0.6)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {slide.line}
                  </p>
                ) : null}
              </div>

              {/* dim veil on the wings */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#1c1410",
                  opacity: isActive ? 0 : 0.42,
                  transition: `opacity ${DUR}s ${EASE}`,
                  pointerEvents: "none",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
