"use client";

import { useMemo, useState } from "react";
import type { S27MemberAccount } from "./storage";

export function MemberPicker({
  members,
  exclude,
  selected,
  onChange,
  max,
  placeholder = "Search members…",
}: {
  members: S27MemberAccount[];
  exclude: string[];
  selected: S27MemberAccount[];
  onChange: (next: S27MemberAccount[]) => void;
  max: number;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const excludeSet = useMemo(() => new Set(exclude), [exclude]);
  const selectedIds = useMemo(() => new Set(selected.map((m) => m.memberNumber)), [selected]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => !excludeSet.has(m.memberNumber) && !selectedIds.has(m.memberNumber))
      .filter((m) => {
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) ||
          m.memberNumber.includes(q) ||
          m.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [members, excludeSet, selectedIds, query]);

  function add(m: S27MemberAccount) {
    if (selected.length >= max) return;
    onChange([...selected, m]);
    setQuery("");
  }

  function remove(memberNumber: string) {
    onChange(selected.filter((m) => m.memberNumber !== memberNumber));
  }

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((m) => (
            <li
              key={m.memberNumber}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e5df] bg-[#faf9f7] px-2.5 py-1 text-[12px]"
            >
              <span>{m.name}</span>
              <button
                type="button"
                onClick={() => remove(m.memberNumber)}
                className="text-[#8a8477] hover:text-[#991b1b]"
                aria-label={`Remove ${m.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected.length < max && (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-[#e8e5df] px-3 py-2.5 text-[14px]"
          />
          {query.trim() && (
            <ul className="overflow-hidden rounded-xl border border-[#e8e5df] bg-white">
              {suggestions.length === 0 ? (
                <li className="px-3 py-2.5 text-[13px] text-[#8a8477]">No members match.</li>
              ) : (
                suggestions.map((m) => (
                  <li key={m.memberNumber}>
                    <button
                      type="button"
                      onClick={() => add(m)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[13px] hover:bg-[#faf9f7]"
                    >
                      <span className="font-medium">{m.name}</span>
                      <span className="text-[11px] text-[#8a8477]">#{m.memberNumber}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
