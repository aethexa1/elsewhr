"use client";

// elsewhr — CurvedMarquee: a line of truth that never stops moving.
// New file: app/CurvedMarquee.tsx
// Adapted from an Originkit/Framer component: Framer internals stripped,
// banner-height, drag-to-fling kept, styled for the elsewhr universe.

import { useRef, useEffect, useState, useMemo, type PointerEvent as ReactPointerEvent } from "react";

const MAX_SPEED = 800;

export default function CurvedMarquee({
  text,
  color = "#fff6ec",
  fontSize = 58,
  baseVelocity = 12,
  curveAmount = -170,
  height = 210,
}: {
  text: string;
  color?: string;
  fontSize?: number;
  baseVelocity?: number;
  curveAmount?: number;
  height?: number;
}) {
  const measureRef = useRef<SVGTextElement>(null);
  const tspansRef = useRef<SVGTSpanElement[]>([]);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const [textWidth, setTextWidth] = useState(0);

  const staticId = useMemo(() => {
    let hash = 0;
    const s = `${text}-${curveAmount}`;
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }, [text, curveAmount]);
  const pathId = `ew-curve-${staticId}`;
  const fadeGradientId = `ew-fadeg-${staticId}`;
  const fadeMaskId = `ew-fadem-${staticId}`;
  const pathD = `M-100,400 Q720,${400 + curveAmount} 1540,400`;

  const isDragging = useRef(false);
  const dragVelocity = useRef(0);
  const actualBaseVelocity = (baseVelocity / 100) * MAX_SPEED;
  const gapPx = 90;
  const processedText = useMemo(() => text.trim(), [text]);
  const spacing = textWidth + gapPx;

  useEffect(() => {
    if (measureRef.current) setTextWidth(measureRef.current.getComputedTextLength());
  }, [text, fontSize]);
  useEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, [curveAmount]);

  const calculatedRepeats = spacing > 0 ? Math.ceil(pathLength / spacing) + 2 : 0;
  const ready = pathLength > 0 && spacing > 0;

  useEffect(() => {
    if (!ready) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      const spans = tspansRef.current;
      if (spans.length > 0) {
        const maxX = (spans.length - 1) * spacing;
        let moveBy = isDragging.current ? 0 : (reduced ? 0 : actualBaseVelocity * (delta / 1e3));
        moveBy += dragVelocity.current;
        dragVelocity.current *= isDragging.current ? 0.9 : 0.96;
        if (Math.abs(dragVelocity.current) < 0.01) dragVelocity.current = 0;
        for (const tspan of spans) {
          if (!tspan) continue;
          let x = parseFloat(tspan.getAttribute("x") || "0");
          x += moveBy;
          if (x < -spacing) x = maxX;
          if (x > maxX) x = -spacing;
          tspan.setAttribute("x", x.toString());
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, spacing, actualBaseVelocity]);

  const lastPointer = useRef({ x: 0, y: 0 });
  const onDown = (e: ReactPointerEvent<SVGTextElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    dragVelocity.current = 0;
  };
  const onMove = (e: ReactPointerEvent<SVGTextElement>) => {
    if (!isDragging.current) return;
    dragVelocity.current = (e.clientX - lastPointer.current.x) * 1.0;
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e: ReactPointerEvent<SVGTextElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    isDragging.current = false;
  };

  return (
    <div aria-hidden style={{ visibility: ready ? "visible" : "hidden", width: "100%", height, overflow: "hidden", position: "relative", touchAction: "pan-y" }}>
      <svg viewBox="120 260 1200 280" preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", userSelect: "none", overflow: "hidden", fill: color, fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize, letterSpacing: "-0.01em" }}
      >
        <text ref={measureRef} xmlSpace="preserve" style={{ visibility: "hidden", opacity: 0, pointerEvents: "none" }}>
          {processedText}
        </text>
        <defs>
          <path ref={pathRef} id={pathId} d={pathD} fill="none" stroke="transparent" />
          <linearGradient id={fadeGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="14%" stopColor="white" stopOpacity="1" />
            <stop offset="86%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id={fadeMaskId}>
            <rect x="120" y="260" width="1200" height="280" fill={`url(#${fadeGradientId})`} />
          </mask>
        </defs>
        {ready && (
          <text xmlSpace="preserve" mask={`url(#${fadeMaskId})`} style={{ cursor: "grab" }}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          >
            <textPath href={`#${pathId}`} xmlSpace="preserve">
              {Array.from({ length: calculatedRepeats }).map((_, i) => (
                <tspan key={i} x={i * spacing}
                  ref={(el) => { if (el) tspansRef.current[i] = el; }}
                >
                  {processedText}
                </tspan>
              ))}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  );
}
