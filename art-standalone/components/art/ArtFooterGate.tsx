"use client";

import { usePathname } from "next/navigation";

/**
 * Hides footer on the home route only (`/`).
 */
export function ArtFooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <>{children}</>;
}
