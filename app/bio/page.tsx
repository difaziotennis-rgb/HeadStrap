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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {/* Photo */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[5/2] rounded-2xl overflow-hidden mb-10">
          <Image
            src="/derek-bio.png"
            alt="Derek DiFazio"
            fill
            className="object-cover object-[center_10%]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f7f7f5]/60 via-transparent to-transparent" />
          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#f7f7f5]/60 to-transparent" />
        </div>

        {/* Bio content */}
        <div className="px-2 sm:px-6 text-center">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#b0a99f] mb-2">
            Tennis Professional
          </p>
          <h1 className="text-[26px] sm:text-[32px] font-light tracking-tight text-[#1a1a1a] mb-6">
            Derek DiFazio
          </h1>

          {/* Quote */}
          <div className="mb-8">
            <div className="w-6 h-px bg-[#d9d5cf] mx-auto mb-6" />
            <p className="text-[17px] sm:text-[20px] font-light italic tracking-tight text-[#6b665e] leading-relaxed">
              &ldquo;Movement is medicine. Play is essential.&rdquo;
            </p>
            <div className="w-6 h-px bg-[#d9d5cf] mx-auto mt-6" />
          </div>

          <p className="text-[15px] sm:text-[16px] leading-[1.9] text-[#4a4540]">
            A native New Yorker, Derek has over 15 years of coaching experience from the beginner to Division I and professional levels and loves working with players of all ages and abilities. A national doubles champion as both a junior and an adult, Derek was ranked as high as #1 in New York and the Eastern Section, before playing #1 singles and doubles at Division I Clemson University where he achieved a top 25 ITA ranking and an ATP singles ranking while competing professionally.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8e5df] mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center">
            <p className="text-[11px] text-[#b0a99f] tracking-wide">
              DiFazio Tennis · Rhinebeck, NY
            </p>
            <p className="text-[11px] text-[#c4bfb8] mt-1.5">
              <a
                href="mailto:difaziotennis@gmail.com"
                className="hover:text-[#8a8477] transition-colors"
              >
                difaziotennis@gmail.com
              </a>
              {" · "}
              <a
                href="tel:6319015220"
                className="hover:text-[#8a8477] transition-colors"
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
