"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

type UserMenuProps = {
  displayName?: string | null;
  email?: string | null;
};

export function UserMenu({ displayName, email }: UserMenuProps) {
  const { logout } = usePrivy();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const label = displayName?.trim() || email?.split("@")[0] || "Account";

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

  return (
    <div ref={rootRef} className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex max-w-[120px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-sm font-medium text-white/85 transition hover:bg-white/[0.07] sm:max-w-[200px] sm:px-3"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-semibold text-amber-300">
          {label[0]?.toUpperCase() ?? "U"}
        </span>
        <span className="hidden truncate min-[380px]:inline">{label}</span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-white/40 transition ${open ? "rotate-180" : ""}`}
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
          role="menu"
          className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#12182b] py-1 shadow-xl shadow-black/40"
        >
          {(displayName || email) && (
            <div className="border-b border-white/8 px-3.5 py-2.5">
              <p className="truncate text-xs text-white/40">Signed in</p>
              <p className="mt-0.5 truncate text-sm text-white/80">
                {displayName || email}
              </p>
            </div>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="flex w-full px-3.5 py-2.5 text-left text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
