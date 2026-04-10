"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

import type { HomePhoto } from "@/lib/art/homepage-media";

import { artDuration, artEase } from "./art-ease";

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: artDuration.reveal, ease: artEase },
  },
};

export function ArtExhibitionMotion({ photos }: { photos: HomePhoto[] }) {
  const reduce = useReducedMotion() === true;
  const stagger = reduce ? 0 : 0.05;

  return (
    <motion.ul
      className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-32px", amount: 0.06 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: reduce ? 0 : 0.03 } },
      }}
    >
      {photos.map((photo) => (
        <motion.li
          key={photo.src}
          variants={itemVariants}
          className="flex flex-col overflow-hidden border border-mcm-cream-200/60 bg-white/70"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-mcm-cream-100/80">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover object-center transition duration-700 ease-out hover:scale-[1.04]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />
          </div>
          <p className="border-t border-mcm-cream-100/80 px-3 py-2 text-left text-[11px] font-light leading-snug text-mcm-brown-600/68">
            {photo.caption}
          </p>
        </motion.li>
      ))}
    </motion.ul>
  );
}
