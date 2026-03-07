"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MemberAuth from "./MemberAuth";
import { rtcNav } from "./rtc-data";

export default function RTCLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/RTC/admin" || pathname.startsWith("/RTC/admin/");

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#1a1a1a]">
      <header className="sticky top-0 z-40 bg-[#faf9f7]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#b0a99f]">DiFazio Tennis</p>
            <h1 className="text-[15px] font-semibold tracking-tight sm:text-[16px]">Rhinebeck Tennis Club</h1>
          </div>
          <div className="flex items-center gap-2">
            <MemberAuth />
            <span className="hidden text-[11px] uppercase tracking-[0.12em] text-[#a39e95] sm:inline">
              Member + Public Access
            </span>
          </div>
        </div>
        {!isAdminRoute && (
          <div className="mx-auto w-full max-w-6xl px-4 pb-3 sm:px-6">
            <nav className="flex gap-1 overflow-x-auto rounded-xl border border-[#e8e5df] bg-white/95 p-1 shadow-[0_8px_18px_rgba(26,26,26,0.06)] sm:rounded-2xl sm:p-1.5 sm:shadow-[0_10px_24px_rgba(26,26,26,0.08)]">
              {rtcNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium text-[#6f695f] transition-colors hover:bg-[#f7f5f1] hover:text-[#1a1a1a] sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-[12px]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
      <div>{children}</div>
      <footer className="border-t border-[#e8e5df] bg-[#f6f4f0]">
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-7 sm:grid-cols-2 sm:px-6 sm:py-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Rhinebeck Tennis Club</p>
            <p className="mt-2 text-[13px] text-[#4a4a4a]">2 Salisbury Ct, Rhinebeck, NY 12572</p>
            <a
              href="tel:+16319015220"
              className="mt-1 block text-[12px] text-[#6b665e] underline-offset-4 hover:text-[#1a1a1a] hover:underline"
            >
              (631) 901-5220
            </a>
            <a
              href="mailto:difaziotennis@gmail.com"
              className="mt-1 block text-[12px] text-[#6b665e] underline-offset-4 hover:text-[#1a1a1a] hover:underline"
            >
              difaziotennis@gmail.com
            </a>
          </div>

          <div className="sm:text-right">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Quick Links</p>
            <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
              <Link href="/RTC/book" className="rounded-md border border-[#dfdbd4] bg-white px-2.5 py-1 text-[11px] text-[#4a4a4a] hover:bg-[#faf9f7]">
                Court Booking
              </Link>
              <Link href="/RTC/lessons" className="rounded-md border border-[#dfdbd4] bg-white px-2.5 py-1 text-[11px] text-[#4a4a4a] hover:bg-[#faf9f7]">
                Lessons
              </Link>
              <Link href="/RTC/clinics" className="rounded-md border border-[#dfdbd4] bg-white px-2.5 py-1 text-[11px] text-[#4a4a4a] hover:bg-[#faf9f7]">
                Clinics
              </Link>
              <Link href="/RTC/events" className="rounded-md border border-[#dfdbd4] bg-white px-2.5 py-1 text-[11px] text-[#4a4a4a] hover:bg-[#faf9f7]">
                Events
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-[#e8e5df]">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
            <p className="text-[11px] text-[#8a8477]">Boutique tennis club in the Hudson Valley.</p>
            <Link href="/RTC/admin" className="text-[10px] uppercase tracking-[0.1em] text-[#b0a99f] hover:text-[#6b665e]">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
