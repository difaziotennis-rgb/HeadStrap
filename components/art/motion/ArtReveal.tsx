"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { artDuration, artEase } from "./art-ease";

type Props = {
  children: ReactNode;
  className?: string;
  /** Slight delay for staggered sequences */
  delay?: number;
  y?: number;
};

export function ArtReveal({ children, className, delay = 0, y = 22 }: Props) {
  const reduce = useReducedMotion() === true;

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-72px", amount: 0.12 }}
      transition={{
        duration: reduce ? 0 : artDuration.reveal,
        delay: reduce ? 0 : delay,
        ease: artEase,
      }}
    >
      {children}
    </motion.div>
  );
}
