"use client";

import { useMemo } from "react";

type Props = {
  seed: string;
  size?: number;
  className?: string;
  tone?: "enemy" | "ally";
};

const PALETTES = {
  enemy: ["#0b1324", "#1e293b", "#475569", "#93c5fd"],
  ally: ["#052e16", "#14532d", "#16a34a", "#86efac"],
};

function hashSeed(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

export function PixelSprite({ seed, size = 96, className = "", tone = "enemy" }: Props) {
  const pixels = useMemo(() => {
    const palette = PALETTES[tone];
    const grid = 16;
    const result: string[] = [];
    const base = hashSeed(seed);

    for (let y = 0; y < grid; y += 1) {
      for (let x = 0; x < grid; x += 1) {
        const mx = x < 8 ? x : 15 - x;
        const value = (base + y * 97 + mx * 61 + y * mx * 17) % 100;
        const edgePenalty = x === 0 || y === 0 || x === 15 || y === 15;
        if (edgePenalty || value < 34) {
          result.push("transparent");
        } else if (value < 55) {
          result.push(palette[1]);
        } else if (value < 76) {
          result.push(palette[2]);
        } else {
          result.push(palette[3]);
        }
      }
    }
    return result;
  }, [seed, tone]);

  return (
    <div
      className={`overflow-hidden rounded-sm border-2 border-slate-700 bg-slate-950 ${className}`}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    >
      <div
        className="grid h-full w-full"
        style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))", gridTemplateRows: "repeat(16, minmax(0, 1fr))" }}
      >
        {pixels.map((color, idx) => (
          <span key={`${seed}_${idx}`} style={{ backgroundColor: color }} />
        ))}
      </div>
    </div>
  );
}
