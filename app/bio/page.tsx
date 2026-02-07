"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";

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
                Book a Lesson
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
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <Link
          href="/book"
          className="inline-flex items-center gap-1 text-[12px] text-[#8a8477] hover:text-[#1a1a1a] font-medium transition-colors mb-8"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to booking
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] p-6 sm:p-10">
          {/* Photo */}
          <div className="w-32 h-40 sm:w-40 sm:h-48 rounded-2xl overflow-hidden mx-auto mb-8 border border-[#e8e5df]">
            <Image
              src="/derek-bio.png"
              alt="Derek DiFazio"
              width={160}
              height={192}
              className="w-full h-full object-cover object-top"
              priority
            />
          </div>

          <h1 className="text-[24px] sm:text-[30px] font-light tracking-tight text-[#1a1a1a] text-center mb-2">
            Derek DiFazio
          </h1>
          <p className="text-[12px] tracking-[0.15em] uppercase text-[#b0a99f] text-center mb-8">
            Tennis Professional
          </p>

          <div className="w-12 h-px bg-[#e8e5df] mx-auto mb-8" />

          <p className="text-[15px] sm:text-[16px] leading-[1.8] text-[#4a4540] text-center">
            A native New Yorker, Derek has over 15 years of coaching experience from the beginner to Division I and professional levels and loves working with players of all ages and abilities. A national doubles champion as both a junior and an adult, Derek was ranked as high as #1 in New York and the Eastern Section, before playing #1 singles and doubles at Division I Clemson University where he achieved a top 25 ITA ranking and an ATP singles ranking while competing professionally.
          </p>

        </div>
      </main>
    </div>
  );
}
