"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MemberAuth from "./MemberAuth";
import { s27Nav } from "./summer27-data";

export default function Summer27Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/Summer27/admin" || pathname?.startsWith("/Summer27/admin/");

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#1a1a1a]">
      <header className="sticky top-0 z-40 bg-[#faf9f7]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/Summer27" className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#b0a99f]">DiFazio Tennis · Summer ’27</p>
            <h1 className="text-[15px] font-semibold tracking-tight sm:text-[16px]">
              Rhinebeck Courts 1 &amp; 2
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            <MemberAuth />
          </div>
        </div>
        {!isAdmin && (
          <div className="mx-auto w-full max-w-6xl px-4 pb-3 sm:px-6">
            <nav className="flex gap-1 overflow-x-auto rounded-xl border border-[#e8e5df] bg-white/95 p-1 shadow-[0_8px_18px_rgba(26,26,26,0.06)] sm:rounded-2xl sm:p-1.5">
              {s27Nav.map((item) => {
                const active =
                  item.href === "/Summer27"
                    ? pathname === "/Summer27"
                    : pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-[12px] ${
                      active
                        ? "bg-[#1a1a1a] text-white"
                        : "text-[#6f695f] hover:bg-[#f7f5f1] hover:text-[#1a1a1a]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>
      <div>{children}</div>
      <footer className="border-t border-[#e8e5df] bg-[#f6f4f0]">
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-7 sm:grid-cols-2 sm:px-6 sm:py-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">DiFazio Tennis at RTC</p>
            <p className="mt-2 text-[13px] text-[#4a4a4a]">Courts 1 &amp; 2 · Pro shop · 2 Salisbury Ct, Rhinebeck, NY</p>
            <a href="tel:+16319015220" className="mt-1 block text-[12px] text-[#6b665e] hover:text-[#1a1a1a]">
              (631) 901-5220
            </a>
            <a href="mailto:difaziotennis@gmail.com" className="mt-1 block text-[12px] text-[#6b665e] hover:text-[#1a1a1a]">
              difaziotennis@gmail.com
            </a>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Season preview</p>
            <p className="mt-2 text-[13px] text-[#6b665e]">
              A first-year program on two courts — lessons, clinics, events, and stringing. Not the full club calendar.
            </p>
            <Link href="/book" className="mt-3 inline-block text-[12px] text-[#6b665e] underline-offset-4 hover:text-[#1a1a1a] hover:underline">
              Back to DiFazio Tennis booking
            </Link>
          </div>
        </div>
        <div className="border-t border-[#e8e5df]">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
            <p className="text-[11px] text-[#8a8477]">Hudson Valley tennis, quietly well run.</p>
            <Link href="/Summer27/admin" className="text-[10px] uppercase tracking-[0.1em] text-[#b0a99f] hover:text-[#6b665e]">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
