"use client";

import Link from "next/link";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useState } from "react";

import { ART_SITE } from "@/lib/art/site";

import { artEase } from "./art-ease";

const nav = [
  { href: "/art", label: "Home" },
  { href: "/art/shop", label: "Work" },
  { href: "/art/about", label: "About" },
] as const;

export function ArtHeader() {
  const reduce = useReducedMotion() === true;
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 20);
  });

  return (
    <header
      className={`sticky top-0 z-50 border-b border-mcm-cream-200/50 backdrop-blur-md transition-[padding,background-color,box-shadow] duration-300 ${
        scrolled ? "bg-[#fbf9f6]/95 py-4 shadow-[0_4px_24px_rgba(44,62,80,0.06)]" : "bg-[#fbf9f6]/80 py-7"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/art" className="group block">
          <p className="font-light tracking-tight text-mcm-charcoal-500 transition-colors group-hover:text-mcm-charcoal-700">
            {ART_SITE.siteTitle}
          </p>
          <p className="mt-1 text-[10px] font-normal uppercase tracking-[0.32em] text-mcm-brown-600/55">
            Hilton Head Island
          </p>
        </Link>
        <nav className="flex flex-wrap items-center gap-6 sm:gap-8" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative text-[13px] font-light tracking-wide text-mcm-charcoal-600/90 transition-colors hover:text-mcm-charcoal-500"
            >
              {item.label}
              {!reduce && (
                <motion.span
                  className="absolute -bottom-0.5 left-0 right-0 h-px origin-left bg-mcm-charcoal-500/45"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.28, ease: artEase }}
                />
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
