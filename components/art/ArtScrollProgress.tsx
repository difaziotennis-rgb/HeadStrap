"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

/**
 * Thin reading-progress bar along the top of the viewport (art routes only).
 * Hidden when prefers-reduced-motion is set.
 */
export function ArtScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 32,
    restDelta: 0.001,
  });

  if (reduce) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[100] h-[3px] bg-mcm-charcoal-500/15"
      aria-hidden
    >
      <motion.div className="h-full w-full origin-left bg-mcm-charcoal-500/45" style={{ scaleX }} />
    </div>
  );
}
