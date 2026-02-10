"use client";

import Link from "next/link";
import { Calendar, ArrowLeft } from "lucide-react";

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Header */}
      <header className="bg-[#faf9f7] border-b border-[#e8e5df] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f]">
              DiFazio Tennis
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/book"
                className="text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
              >
                Book
              </Link>
              <Link
                href="/bio"
                className="text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
              >
                Bio
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

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1a1a1a] mb-2">
            Events
          </h1>
        </div>

        {/* Memorial Day Mixed Doubles */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] overflow-hidden">
          <div className="px-6 sm:px-8 py-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#f7f7f5] border border-[#e8e5df] rounded-xl flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[#7a756d]" />
              </div>
              <div className="flex-1">
                <h2 className="text-[18px] sm:text-[20px] font-medium text-[#1a1a1a] tracking-tight">
                  Memorial Day Mixed Doubles
                </h2>
                <p className="text-[13px] text-[#8a8477] mt-1">
                  Saturday, May 23, 2026 · Rhinebeck Tennis Club
                </p>
                <div className="mt-5 inline-block px-4 py-2 bg-[#faf9f7] border border-[#e8e5df] rounded-lg">
                  <p className="text-[13px] text-[#7a756d] font-medium">
                    Sign ups coming Spring &apos;26
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            href="/book"
            className="inline-flex items-center gap-1.5 text-[12px] text-[#8a8477] hover:text-[#1a1a1a] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to booking
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8e5df] mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-[11px] text-[#b0a99f] tracking-wide">
            DiFazio Tennis · Rhinebeck, NY
          </p>
        </div>
      </footer>
    </div>
  );
}
