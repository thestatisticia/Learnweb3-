"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6.5A1.5 1.5 0 015.5 5h13A1.5 1.5 0 0120 6.5v11a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17.5v-11z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M5 7l7 5 7-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type AuthButtonsProps = {
  className?: string;
};

export function AuthButtons({ className = "" }: AuthButtonsProps) {
  const { ready, login } = usePrivy();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async () => {
    setError(null);
    setPending(true);
    try {
      await Promise.resolve(login({ loginMethods: ["email"] }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Email login failed. Try again.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={`flex w-full flex-col gap-3 ${className}`}>
      <button
        type="button"
        disabled={!ready || pending}
        onClick={() => void handleEmailLogin()}
        className="glow-border inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MailIcon className="h-5 w-5 text-amber-200" />
        {pending ? "Opening…" : "Start learning free"}
      </button>

      {error && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left text-xs text-amber-100">
          {error}
        </p>
      )}
    </div>
  );
}

export function StartLearningButton({
  className = "",
  children = "Start learning free",
  variant = "primary",
}: {
  className?: string;
  children?: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  const { ready, login } = usePrivy();

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() => login({ loginMethods: ["email"] })}
      className={
        variant === "ghost"
          ? `inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-medium text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-50 ${className}`
          : `glow-border inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition disabled:opacity-50 ${className}`
      }
    >
      {children}
    </button>
  );
}
