"use client";

// elsewhr — the page turn: navigation feels like a book, not a form.
// New file: app/template.tsx
// App Router re-mounts a template on every navigation, so every page ENTERS
// with a turn: a slight 3D hinge from the left edge, settling flat.
// Respects prefers-reduced-motion (fades only).

import type { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <div className="ew-pageturn" style={{ transformOrigin: "left center" }}>
      {children}
      <style>{`
        .ew-pageturn {
          animation: ew-turn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
          perspective: 1200px;
        }
        @keyframes ew-turn {
          0% {
            opacity: 0;
            transform: perspective(1200px) rotateY(-7deg) translateX(14px) scale(0.992);
            filter: brightness(1.06);
          }
          55% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: perspective(1200px) rotateY(0deg) translateX(0) scale(1);
            filter: brightness(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ew-pageturn {
            animation: ew-fade 0.25s ease-out both;
          }
          @keyframes ew-fade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}
