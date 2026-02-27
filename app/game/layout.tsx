import type { Metadata } from "next";
import "./game.css";

export const metadata: Metadata = {
  title: "DiFazio Game Lab",
  description: "Retro-inspired monster RPG sandbox in development.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GameLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="game-retro-wrap min-h-screen text-slate-100 pixel-text">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">{children}</div>
    </div>
  );
}
