"use client";

import { useEffect, useState } from "react";

/**
 * Reading-progress bar — vanilla scroll + transform (no Framer).
 * Avoids SSR/hydration mismatches from motion hooks.
 */
export function ArtScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const update = () => {
      const el = document.documentElement;
      const scrollable = el.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[100] h-[3px] bg-mcm-charcoal-500/15 [@media(prefers-reduced-motion:reduce)]:hidden"
      aria-hidden
    >
      <div
        className="h-full w-full origin-left bg-mcm-charcoal-500/45 will-change-transform"
        style={{
          transform: `scaleX(${progress})`,
          transformOrigin: "left center",
        }}
      />
    </div>
  );
}
