"use client";

type Props = {
  speciesId: string;
  size?: number;
  className?: string;
  state?: "idle" | "attacking" | "hit" | "faint";
  side?: "ally" | "enemy";
};

function hashSpecies(speciesId: string) {
  let hash = 0;
  for (let i = 0; i < speciesId.length; i += 1) {
    hash = (hash * 31 + speciesId.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function motionClass(speciesId: string) {
  const motion = hashSpecies(speciesId) % 4;
  if (motion === 0) return "creature-motion-bob";
  if (motion === 1) return "creature-motion-sway";
  if (motion === 2) return "creature-motion-prowl";
  return "creature-motion-hover";
}

export function BattleCreatureSprite({
  speciesId,
  size = 108,
  className = "",
  state = "idle",
  side = "enemy",
}: Props) {
  const frame = hashSpecies(speciesId) % 16;
  const col = frame % 4;
  const row = Math.floor(frame / 4);
  const stateClass =
    state === "attacking"
      ? side === "ally"
        ? "creature-state-attack-right"
        : "creature-state-attack-left"
      : state === "hit"
        ? "creature-state-hit"
        : state === "faint"
          ? "creature-state-faint"
          : motionClass(speciesId);

  return (
    <div
      className={`battle-creature relative ${stateClass} ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: "url('/game/sprites/creature-atlas-alpha-fixed.png')",
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
