"use client";

import { useEffect, useRef, useState } from "react";
import { APP_CHAINS, type AppChainId } from "@/lib/chains";

const CHAIN_COLORS: Record<AppChainId, string> = {
  base: "bg-blue-400",
  celo: "bg-amber-400",
  stellar: "bg-violet-400",
};

type ChainSelectorProps = {
  selected: AppChainId;
  onSelect: (chainId: AppChainId) => void;
  compact?: boolean;
  dark?: boolean;
};

export function ChainSelector({
  selected,
  onSelect,
  compact = false,
}: ChainSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (compact) {
    const active = APP_CHAINS[selected];

    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-white/85 transition hover:bg-white/[0.07]"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${CHAIN_COLORS[selected]}`} />
          {active.label}
          <svg
            className={`h-3.5 w-3.5 text-white/40 transition ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute left-0 z-30 mt-2 min-w-[168px] overflow-hidden rounded-2xl border border-white/10 bg-[#12182b] py-1 shadow-xl shadow-black/40"
          >
            {(Object.keys(APP_CHAINS) as AppChainId[]).map((chainId) => {
              const chain = APP_CHAINS[chainId];
              const isActive = selected === chainId;
              return (
                <button
                  key={chainId}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onSelect(chainId);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition ${
                    isActive
                      ? "bg-amber-500/15 text-amber-200"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${CHAIN_COLORS[chainId]}`}
                  />
                  <span className="flex-1">{chain.label}</span>
                  <span className="text-[11px] text-white/30">{chain.symbol}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {(Object.keys(APP_CHAINS) as AppChainId[]).map((chainId) => {
        const chain = APP_CHAINS[chainId];
        const isActive = selected === chainId;

        return (
          <button
            key={chainId}
            type="button"
            onClick={() => onSelect(chainId)}
            className={`rounded-2xl border p-4 text-left transition ${
              isActive
                ? "border-amber-400/40 bg-amber-400/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${CHAIN_COLORS[chainId]}`}
              />
              <p className="text-sm font-semibold text-white">{chain.label}</p>
            </div>
            <p className="mt-2 text-xs text-white/45">{chain.description}</p>
          </button>
        );
      })}
    </div>
  );
}
