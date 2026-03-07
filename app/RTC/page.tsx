"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import OverviewEnhancements from "./OverviewEnhancements";
import TodaySnapshots from "./TodaySnapshots";
import { getRTCEventImage, rtcSummerEvents } from "./rtc-data";
import { MEMBER_SESSION_EVENT, MEMBER_SESSION_KEY, parseMemberSession } from "./member-session";

export default function RTCPage() {
  const [memberSignedIn, setMemberSignedIn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function applySession() {
      setMemberSignedIn(!!parseMemberSession(localStorage.getItem(MEMBER_SESSION_KEY)));
    }
    applySession();
    window.addEventListener(MEMBER_SESSION_EVENT, applySession);
    window.addEventListener("storage", applySession);
    return () => {
      window.removeEventListener(MEMBER_SESSION_EVENT, applySession);
      window.removeEventListener("storage", applySession);
    };
  }, []);

  return (
    <main>
      <section className="mx-auto w-full max-w-6xl px-3 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-10">
        <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white shadow-[0_14px_36px_rgba(26,26,26,0.07)]">
          <div className="relative border-b border-[#f0ede8] p-4 sm:p-10">
            <Image
              src="/images/hudson-valley.png"
              alt="Hudson Valley landscape near Rhinebeck, New York"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/25 to-black/15" />
            <div className="relative">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/85">Hudson Valley, New York</p>
              <h2 className="mt-2 max-w-4xl text-[28px] font-semibold tracking-tight text-white sm:text-5xl">
                The Rhinebeck Tennis Club.
              </h2>
              <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-white/90 sm:mt-4 sm:text-[15px]">
                Tennis in the Hudson Valley, where each visit feels easy to settle into and hard to leave.
              </p>
            </div>

            <div className="relative mt-5 flex flex-wrap items-center gap-2 text-[12px] font-medium sm:mt-7">
              <Link
                href={memberSignedIn ? "/RTC/book" : "/RTC/member"}
                className="rounded-lg border border-white/50 bg-white/90 px-3 py-1.5 text-[11px] text-[#1a1a1a] hover:bg-white sm:px-4 sm:py-2 sm:text-[12px]"
              >
                {memberSignedIn ? "Book Court" : "Explore Membership"}
              </Link>
              <Link href="/RTC/member/portal" className="rounded-lg border border-white/50 bg-white/90 px-3 py-1.5 text-[11px] text-[#1a1a1a] hover:bg-white sm:px-4 sm:py-2 sm:text-[12px]">
                Member Dashboard
              </Link>
            </div>
          </div>

          <div className="grid gap-2.5 bg-[#faf9f7] p-3.5 sm:gap-3 sm:p-6">
            <TodaySnapshots />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-3 pb-8 sm:px-6 sm:pb-14">
        <OverviewEnhancements memberSignedIn={memberSignedIn} />

        <div id="this-month" className="scroll-mt-28">
          <details className="rounded-2xl border border-[#e8e5df] bg-white p-6">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Upcoming Events at RTC</p>
              <span className="text-[12px] font-medium text-[#6b665e]">Tap to Expand</span>
            </summary>
            <div className="mt-3">
              <Link href="/RTC/events" className="text-[12px] font-medium text-[#6b665e] hover:text-[#1a1a1a]">
                View Full Calendar
              </Link>
            </div>
            <div className="mt-3 grid gap-3">
              {rtcSummerEvents.slice(0, 3).map((event) => (
                <Link
                  key={event.id}
                  href={`/RTC/events/${event.id}`}
                  className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3 transition-colors hover:bg-white sm:p-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getRTCEventImage(event.id)}
                      alt={`${event.title} preview`}
                      className="h-14 w-20 flex-none rounded-lg border border-[#e8e5df] object-cover sm:h-16 sm:w-24"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{event.category}</p>
                      <h4 className="mt-0.5 text-[15px] font-semibold sm:text-[17px]">{event.title}</h4>
                      <p className="mt-0.5 text-[12px] text-[#6b665e] sm:text-[13px]">
                        {event.dateLabel} · {event.timeLabel}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </details>
        </div>
      </section>
    </main>
  );
}
