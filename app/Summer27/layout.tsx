"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MemberAuth from "./MemberAuth";
import { s27Nav } from "./summer27-data";
import { useS27Session } from "./use-s27-session";

export default function Summer27Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const session = useS27Session();
  const isAdmin = pathname === "/Summer27/admin" || pathname?.startsWith("/Summer27/admin/");
  const nav = s27Nav.filter((item) => !item.memberOnly || session);

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#1a1a1a]">
      <header className="sticky top-0 z-40 border-b border-[#ece8e2]/80 bg-[#faf9f7]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
          <Link href="/Summer27" className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#b0a99f]">DiFazio Tennis</p>
            <h1 className="truncate text-[15px] font-semibold tracking-tight">Rhinebeck Tennis Club</h1>
          </Link>
          <MemberAuth />
        </div>
        {!isAdmin && (
          <div className="mx-auto w-full max-w-6xl px-3 pb-3 sm:px-6">
            <nav className="-mx-0.5 flex gap-1 overflow-x-auto px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {nav.map((item) => {
                const active =
                  item.href === "/Summer27"
                    ? pathname === "/Summer27"
                    : pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 rounded-full px-3.5 py-2 text-[12px] font-medium transition-colors ${
                      active
                        ? "bg-[#1a1a1a] text-white"
                        : "bg-white text-[#6f695f] ring-1 ring-[#e8e5df] hover:text-[#1a1a1a]"
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
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-7 sm:grid-cols-2 sm:px-6 sm:py-8">
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
            <p className="text-[13px] text-[#6b665e]">Rhinebeck, New York</p>
          </div>
        </div>
        <div className="border-t border-[#e8e5df]">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
            <p className="text-[11px] text-[#8a8477]">Summer 2027</p>
            <Link href="/Summer27/admin" className="text-[10px] uppercase tracking-[0.1em] text-[#b0a99f] hover:text-[#6b665e]">
              Director desk
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
