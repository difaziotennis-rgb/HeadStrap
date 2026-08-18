"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { s27Pros, type ProDef } from "../../summer27-data";
import { getLivePros } from "../../schedule";

function BioQuote({ quote }: { quote: string }) {
  const parts = quote.split(/(?<=\.)\s+/).filter(Boolean);
  const lead = parts[0] ?? quote;
  const rest = parts.slice(1).join(" ");
  return (
    <div className="mb-10">
      <span className="mb-2 block text-[28px] font-extralight leading-none text-white/30 sm:text-[36px]">
        &ldquo;
      </span>
      <p className="text-[18px] font-extralight leading-snug tracking-tight text-white sm:text-[22px]">
        {lead}
        {rest ? (
          <>
            <br />
            <span className="text-white/60">{rest}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}

export default function Summer27ProBioPage() {
  const params = useParams<{ id: string }>();
  const [pro, setPro] = useState<ProDef | undefined>(() => s27Pros.find((p) => p.id === params.id));

  useEffect(() => {
    try {
      const live = getLivePros().find((p) => p.id === params.id);
      if (live) setPro(live);
    } catch {
      // keep default
    }
  }, [params.id]);

  if (!pro) {
    return (
      <main className="relative z-10 mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-[14px] text-white/60">Pro not found.</p>
        <Link href="/Summer27/lessons" className="mt-3 inline-block text-[13px] text-white/70 underline hover:text-white">
          Back to lessons
        </Link>
      </main>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-7.5rem)]">
      <div className="fixed inset-0 z-0">
        {pro.image ? (
          <Image
            src={pro.image}
            alt={pro.name}
            fill
            className="origin-top object-cover object-top scale-[1.52] sm:scale-100"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-[#0b0b0b]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
      </div>

      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-16 pt-16 sm:px-6 sm:pt-20">
        <div className="text-center">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/50">{pro.title}</p>
          <h1 className="mb-8 text-[28px] font-light tracking-tight text-white sm:text-[36px]">{pro.name}</h1>

          {pro.quote ? <BioQuote quote={pro.quote} /> : null}

          <div className="mx-auto mb-8 h-px w-8 bg-white/20" />

          <p className="text-[15px] leading-[1.9] text-white/80 sm:text-[16px]">{pro.longBio || pro.bio}</p>
        </div>
      </main>

      <footer className="relative z-10">
        <div className="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
          <div className="mb-5 border-t border-white/10" />
          <div className="text-center">
            <p className="text-[11px] tracking-wide text-white/40">DiFazio Tennis · Rhinebeck, NY</p>
            <p className="mt-1.5 text-[11px] text-white/30">
              <a href="mailto:difaziotennis@gmail.com" className="transition-colors hover:text-white/70">
                difaziotennis@gmail.com
              </a>
              {" · "}
              <a href="tel:6319015220" className="transition-colors hover:text-white/70">
                631-901-5220
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
