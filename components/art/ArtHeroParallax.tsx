import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Static hero background layer (no scroll-linked motion — avoids hydration/runtime issues).
 * Parallax was removed for reliability; overflow + tall image still give depth.
 */
export function ArtHeroParallax({ children, className }: Props) {
  return <div className={className}>{children}</div>;
}
