"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { artDuration, artEase } from "./art-ease";

/**
 * Route cross-fade. Avoids AnimatePresence here — it can suppress the first paint in the App Router.
 */
export function ArtPageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const reduce = reduceMotion === true;

  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : artDuration.fast, ease: artEase }}
    >
      {children}
    </motion.div>
  );
}
