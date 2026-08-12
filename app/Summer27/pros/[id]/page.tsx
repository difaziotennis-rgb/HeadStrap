"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  COURTS,
  lessonRateForPro,
  proScheduleLabel,
  s27Pros,
  type ProDef,
} from "../../summer27-data";
import { getLivePros } from "../../schedule";

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
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-[14px] text-[#6b665e]">Pro not found.</p>
        <Link href="/Summer27/lessons" className="mt-3 inline-block text-[13px] underline">
          Back to lessons
        </Link>
      </main>
    );
  }

  const courtName = COURTS.find((c) => c.id === pro.courtId)?.name || pro.courtId;
  const initials = pro.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <main className="pb-12">
      <div className="relative overflow-hidden bg-[#1e3a5f]">
        {pro.image ? (
          <div className="absolute inset-0">
            <Image src={pro.image} alt="" fill priority className="object-cover object-top opacity-45" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1e3a5f] via-[#1e3a5f]/75 to-[#1e3a5f]/35" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_40%)]" />
        )}

        <div className="relative mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8">
          <Link href="/Summer27/lessons" className="text-[12px] text-white/70 hover:text-white">
            ← Lessons
          </Link>
          <div className="mt-8 flex flex-wrap items-end gap-5">
            {!pro.image && (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-[22px] font-semibold tracking-tight text-white">
                {initials}
              </div>
            )}
            <div className="min-w-0 text-white">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/70">{pro.title}</p>
              <h1 className="mt-1 text-[28px] font-semibold tracking-tight sm:text-4xl">{pro.name}</h1>
              <p className="mt-2 text-[14px] text-white/80">{pro.focus}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        {pro.quote ? (
          <blockquote className="mt-6 rounded-2xl border border-[#e8e5df] bg-white px-5 py-4 text-[17px] font-medium leading-snug tracking-tight text-[#1a1a1a] sm:text-[18px]">
            “{pro.quote}”
          </blockquote>
        ) : null}

        <section className="mt-5 rounded-2xl border border-[#e8e5df] bg-white p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">About</p>
          <p className="mt-3 text-[15px] leading-relaxed text-[#4a4a4a]">{pro.longBio || pro.bio}</p>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e8e5df] bg-[#faf9f7] p-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Court</p>
            <p className="mt-1 text-[14px] font-medium text-[#1a1a1a]">{courtName}</p>
          </div>
          <div className="rounded-2xl border border-[#e8e5df] bg-[#faf9f7] p-4 sm:col-span-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Hours</p>
            <p className="mt-1 text-[14px] font-medium text-[#1a1a1a]">{proScheduleLabel(pro)}</p>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/Summer27/lessons?pro=${encodeURIComponent(pro.id)}`}
            className="rounded-full bg-[#1a1a1a] px-5 py-2.5 text-[13px] font-medium text-white"
          >
            Book a lesson · ${lessonRateForPro(pro, true)}/hr
          </Link>
          <Link
            href="/Summer27/lessons"
            className="rounded-full border border-[#e8e5df] bg-white px-5 py-2.5 text-[13px] font-medium text-[#4a4a4a]"
          >
            All pros
          </Link>
        </div>
      </div>
    </main>
  );
}
