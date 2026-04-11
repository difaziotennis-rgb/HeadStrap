"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { HERO_FULLBLEED_IMAGE_SRC } from "@/lib/art/homepage-media";

import { artDuration, artEase } from "./art-ease";

type Props = { children: ReactNode };

export function ArtHeroSection({ children }: Props) {
  const reduceMotion = useReducedMotion();
  const reduce = reduceMotion === true;

  return (
    <section className="relative min-h-[min(88vh,820px)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#f7f4ef]">
        <img
          src={HERO_FULLBLEED_IMAGE_SRC}
          alt=""
          className="h-full w-full object-cover object-[center_42%] sm:object-center"
          decoding="async"
          fetchPriority="high"
        />
      </div>
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-5 pb-14 pt-12 sm:pb-16 sm:pt-14 md:min-h-[min(84vh,800px)] md:justify-center md:pb-20 md:pt-0">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : artDuration.reveal + 0.08, ease: artEase, delay: reduce ? 0 : 0.04 }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}
