"use client";

import Link from "next/link";
import Image from "next/image";

export default function BioPage() {
  return (
    <div className="min-h-screen relative">
      {/* Full-page background image */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/derek-bio.png"
          alt="Derek DiFazio"
          fill
          className="object-cover object-[center_25%] scale-125"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
      </div>

      {/* Header */}
      <header className="relative z-40 bg-black/30 backdrop-blur-sm border-b border-white/10 sticky top-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/50">
                DiFazio Tennis
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/book"
                className="text-white/60 hover:text-white text-[12px] font-medium transition-colors"
              >
                Book
              </Link>
              <Link
                href="/ladder"
                className="text-white/60 hover:text-white text-[12px] font-medium transition-colors"
              >
                Ladder
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16">
        <div className="text-center">
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/50 mb-2">
            Tennis Professional
          </p>
          <h1 className="text-[28px] sm:text-[36px] font-light tracking-tight text-white mb-8">
            Derek DiFazio
          </h1>

          {/* Quote */}
          <div className="mb-10">
            <span className="text-[28px] sm:text-[36px] font-extralight leading-none text-white/30 block mb-2">&ldquo;</span>
            <p className="text-[18px] sm:text-[22px] font-extralight tracking-tight text-white leading-snug">
              Movement is medicine.
              <br />
              <span className="text-white/60">Play is essential.</span>
            </p>
          </div>

          <div className="w-8 h-px bg-white/20 mx-auto mb-8" />

          <p className="text-[15px] sm:text-[16px] leading-[1.9] text-white/80">
            A native New Yorker, Derek has over 15 years of coaching experience from the beginner to Division I and professional levels and loves working with players of all ages and abilities. A national doubles champion as both a junior and an adult, Derek was ranked as high as #1 in New York and the Eastern Section, before playing #1 singles and doubles at Division I Clemson University where he achieved a top 25 ITA ranking and an ATP singles ranking while competing professionally.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
          <div className="border-t border-white/10 mb-5" />
          <div className="text-center">
            <p className="text-[11px] text-white/40 tracking-wide">
              DiFazio Tennis · Rhinebeck, NY
            </p>
            <p className="text-[11px] text-white/30 mt-1.5">
              <a
                href="mailto:difaziotennis@gmail.com"
                className="hover:text-white/70 transition-colors"
              >
                difaziotennis@gmail.com
              </a>
              {" · "}
              <a
                href="tel:6319015220"
                className="hover:text-white/70 transition-colors"
              >
                631-901-5220
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
