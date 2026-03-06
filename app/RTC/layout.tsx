import Link from "next/link";
import { rtcNav } from "./rtc-data";

export default function RTCLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#1a1a1a]">
      <header className="sticky top-0 z-40 border-b border-[#e8e5df] bg-[#faf9f7]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#b0a99f]">DiFazio Tennis</p>
            <h1 className="text-[16px] font-semibold tracking-tight">Rhinebeck Tennis Club</h1>
          </div>
          <span className="text-[11px] uppercase tracking-[0.12em] text-[#a39e95]">Member + Public Access</span>
        </div>
        <div className="border-t border-[#f0ede8]">
          <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
            {rtcNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-[12px] font-medium text-[#7a756d] transition-colors hover:bg-white hover:text-[#1a1a1a]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
