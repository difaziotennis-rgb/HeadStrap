"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { formatUsd } from "@/lib/art/catalog";
import type { ArtPiece } from "@/lib/art/types";

import { artDuration, artEase } from "./art-ease";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: artDuration.reveal, ease: artEase },
  },
};

export function ArtFeaturedMotion({ pieces }: { pieces: ArtPiece[] }) {
  const reduce = useReducedMotion() === true;
  const stagger = reduce ? 0 : 0.07;

  return (
    <motion.ul
      className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px", amount: 0.08 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: reduce ? 0 : 0.04 } },
      }}
    >
      {pieces.map((piece) => (
        <motion.li key={piece.slug} variants={itemVariants}>
          <Link
            href={`/art/shop/${piece.slug}`}
            className="group flex flex-col overflow-hidden border border-mcm-cream-200/70 bg-white/80 transition hover:border-mcm-cream-300"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-mcm-cream-100/80">
              {piece.images[0] ? (
                <Image
                  src={piece.images[0]}
                  alt={piece.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized
                />
              ) : null}
              {piece.availability === "sold" && (
                <span className="absolute left-2 top-2 border border-white/30 bg-mcm-charcoal-500/80 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-white">
                  Sold
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col border-t border-mcm-cream-100/80 p-3 pt-2.5">
              <span className="font-normal text-[15px] text-mcm-charcoal-500 group-hover:text-mcm-charcoal-700">
                {piece.title}
              </span>
              <span className="mt-1.5 text-[13px] font-light text-mcm-brown-600/65">
                <span className="capitalize">{piece.category}</span>
                <span className="mx-1.5 text-mcm-cream-300">·</span>
                {piece.availability === "available" ? formatUsd(piece.priceUsd) : "Sold"}
              </span>
            </div>
          </Link>
        </motion.li>
      ))}
    </motion.ul>
  );
}
