"use client";

import { usePathname } from "next/navigation";

/**
 * Hides footer on the art home route only (`/art`).
 */
export function ArtFooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/art") return null;
  return <>{children}</>;
}
