"use client";

type Props = {
  speciesId: string;
  size?: number;
  className?: string;
};

function hashSpecies(speciesId: string) {
  let hash = 0;
  for (let i = 0; i < speciesId.length; i += 1) {
    hash = (hash * 31 + speciesId.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function BattleCreatureSprite({ speciesId, size = 88, className = "" }: Props) {
  const frame = hashSpecies(speciesId) % 16;
  const col = frame % 4;
  const row = Math.floor(frame / 4);

  return (
    <div
      className={`battle-creature relative ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: "url('/game/sprites/creature-atlas-transparent.png')",
        backgroundSize: "400% 400%",
        backgroundPosition: `${(col / 3) * 100}% ${(row / 3) * 100}%`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
      }}
    >
      <span className="battle-creature-shadow" />
    </div>
  );
}
