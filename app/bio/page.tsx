"use client";

import Link from "next/link";
import Image from "next/image";

export default function BioPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Header */}
      <header className="bg-[#faf9f7] border-b border-[#e8e5df] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f]">
                DiFazio Tennis
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/book"
                className="text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
              >
                Book
              </Link>
              <Link
                href="/ladder"
                className="text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
              >
                Ladder
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Photo */}
        <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] rounded-2xl overflow-hidden mb-10 mt-2 sm:mt-4">
          <Image
            src="/derek-bio.png"
            alt="Derek DiFazio"
            fill
            className="object-cover object-[center_35%]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f7f7f5]/60 via-transparent to-transparent" />
        </div>

        {/* Bio content */}
        <div className="px-2 sm:px-6 text-center">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#b0a99f] mb-2">
            Tennis Professional
          </p>
          <h1 className="text-[26px] sm:text-[32px] font-light tracking-tight text-[#1a1a1a] mb-6">
            Derek DiFazio
          </h1>

          <div className="w-10 h-px bg-[#e8e5df] mx-auto mb-8" />

          <p className="text-[15px] sm:text-[16px] leading-[1.9] text-[#4a4540]">
            A native New Yorker, Derek has over 15 years of coaching experience from the beginner to Division I and professional levels and loves working with players of all ages and abilities. A national doubles champion as both a junior and an adult, Derek was ranked as high as #1 in New York and the Eastern Section, before playing #1 singles and doubles at Division I Clemson University where he achieved a top 25 ITA ranking and an ATP singles ranking while competing professionally.
          </p>
        </div>
      </main>
    </div>
  );
}
