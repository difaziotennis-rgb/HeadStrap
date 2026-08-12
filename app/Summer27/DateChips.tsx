"use client";

import { parseDateInput } from "./summer27-data";

type Chip = {
  value: string;
  top?: string;
  middle: string;
  bottom?: string;
  disabled?: boolean;
};

export function DateChips({
  items,
  value,
  onChange,
  ariaLabel = "Choose a date",
}: {
  items: Chip[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="listbox"
      aria-label={ariaLabel}
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="option"
            aria-selected={active}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            className={`min-w-[4.5rem] shrink-0 rounded-2xl border px-3 py-2.5 text-center transition ${
              active
                ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                : "border-[#e8e5df] bg-white text-[#1a1a1a] hover:bg-[#faf9f7]"
            } ${item.disabled ? "opacity-40" : ""}`}
          >
            {item.top ? (
              <p className={`text-[10px] uppercase tracking-[0.12em] ${active ? "text-white/70" : "text-[#8a8477]"}`}>
                {item.top}
              </p>
            ) : null}
            <p className="mt-0.5 text-[15px] font-semibold leading-none">{item.middle}</p>
            {item.bottom ? (
              <p className={`mt-1 text-[10px] ${active ? "text-white/75" : "text-[#8a8477]"}`}>{item.bottom}</p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function dateChipFromIso(iso: string, bottom?: string): Chip {
  const d = parseDateInput(iso);
  return {
    value: iso,
    top: d.toLocaleDateString("en-US", { weekday: "short" }),
    middle: String(d.getDate()),
    bottom: bottom ?? d.toLocaleDateString("en-US", { month: "short" }),
  };
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-[#e8e5df] bg-[#faf9f7] p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
              active ? "bg-[#1a1a1a] text-white" : "text-[#6b665e]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
