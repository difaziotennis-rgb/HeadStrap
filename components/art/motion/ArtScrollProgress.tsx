"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

/** Thin top progress for long art pages — subtle wayfinding. */
export function ArtScrollProgress() {
  const reduce = useReducedMotion() === true;
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  if (reduce) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[100] h-[2px] origin-left bg-mcm-charcoal-500/25"
      style={{ scaleX }}
      aria-hidden
    />
  );
}
