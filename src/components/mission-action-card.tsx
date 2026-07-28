"use client";

import type { TxPreview, TxReflection } from "@/lib/chat-types";
import { shortenAddress } from "@/lib/wallets";

type MissionActionCardProps = {
  preview: TxPreview;
  phase: "simulate" | "confirm";
  status: "ready" | "loading" | "success" | "error";
  error?: string;
  onSimulateContinue?: () => void;
  onConfirm: () => void;
};

export function MissionActionCard({
  preview,
  phase,
  status,
  error,
  onSimulateContinue,
  onConfirm,
}: MissionActionCardProps) {
  const isLoading = status === "loading";
  const rootClass =
    phase === "simulate"
      ? "glow-stage-simulate border-amber-500/20 bg-[#0a0f1a]"
      : "glow-stage-confirm border-amber-500/35 bg-[#0a0f1a]";

  const detailsClass =
    phase === "confirm"
      ? "border-amber-500/20 bg-[#0c1428]/75"
      : "border-white/6 bg-black/20";

  return (
    <div className={`mt-3 rounded-2xl border p-3.5 ${rootClass}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-amber-400/80">
        {phase === "simulate" ? "Practice mode" : "Wallet confirmation"}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{preview.title}</p>

      <div className={`mt-3 space-y-2 rounded-xl border p-3 text-xs ${detailsClass}`}>
        <PreviewRow label="Network" value={preview.network} />
        <PreviewRow
          label="Balance before"
          value={`${trimBalance(preview.balanceBefore)} ${preview.symbol}`}
        />
        <PreviewRow
          label="Balance after"
          value={`${trimBalance(preview.balanceAfter)} ${preview.symbol}`}
        />
        <PreviewRow label="Amount" value={preview.amount} />
        <PreviewRow
          label="Est. gas"
          value={`≈${trimBalance(preview.gasEstimate)} ${preview.symbol}`}
        />
        {preview.recipient && (
          <PreviewRow
            label="To"
            value={shortenAddress(preview.recipient, 6)}
          />
        )}
        {preview.contractAddress && (
          <PreviewRow
            label="Contract"
            value={shortenAddress(preview.contractAddress, 6)}
          />
        )}
      </div>

      {phase === "simulate" && (
        <p className="mt-3 text-xs leading-relaxed text-white/45">
          Nothing has happened yet. This is a simulation so you can see the
          outcome before signing.
        </p>
      )}

      {phase === "confirm" && (
        <p className="mt-3 text-xs leading-relaxed text-amber-200/70">
          Your wallet will ask you to approve this transaction. Only you can
          authorize it.
        </p>
      )}

      {phase === "simulate" ? (
        <button
          type="button"
          disabled={isLoading}
          onClick={onSimulateContinue}
          className="mt-3 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-sm font-semibold text-black transition hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 shadow-[0_0_22px_rgba(245,166,35,0.14)] hover:shadow-[0_0_32px_rgba(245,166,35,0.26)]"
        >
          {isLoading ? "Loading preview…" : "Continue to wallet confirm"}
        </button>
      ) : (
        <button
          type="button"
          disabled={isLoading}
          onClick={onConfirm}
          className="mt-3 w-full shine-button rounded-full bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-sm font-semibold text-black transition hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 shadow-[0_0_26px_rgba(245,166,35,0.18)] hover:shadow-[0_0_40px_rgba(245,166,35,0.30)]"
        >
          {isLoading ? "Waiting for wallet…" : `Confirm in wallet`}
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function TxReflectionCard({ reflection }: { reflection: TxReflection }) {
  return (
    <div className="mt-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 glow-stage-success">
      <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">
        Transaction complete
      </p>

      <div className="mt-3 space-y-2 text-xs">
        <PreviewRow label="Network" value={reflection.network} />
        <PreviewRow label="Gas used" value={`≈${trimBalance(reflection.gasUsed)} ETH`} />
        <div className="flex items-center justify-between gap-2">
          <span className="shrink-0 text-white/40">Hash</span>
          <code className="min-w-0 truncate rounded bg-white/8 px-2 py-1 font-mono text-[11px] text-emerald-200">
            {shortenAddress(reflection.hash, 6)}
          </code>
        </div>
        <div className="pt-1">
          <a
            href={reflection.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-300 transition hover:border-emerald-300/40 hover:text-emerald-200"
          >
            Open in explorer
          </a>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/6 bg-black/20 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-white/35">
          What happened?
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-white/65">
          {reflection.whatHappened}
        </p>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-white/40">{label}</span>
      <span className="truncate text-right font-medium text-white/80">{value}</span>
    </div>
  );
}

function trimBalance(value: string) {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  if (num === 0) return "0";
  if (num < 0.0001) return "<0.0001";
  return num.toFixed(4);
}
