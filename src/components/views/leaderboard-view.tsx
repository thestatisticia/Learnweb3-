"use client";

import { useCallback, useEffect, useState } from "react";
import { useMultichainWallets } from "@/hooks/use-multichain-wallets";
import { shortenAddress } from "@/lib/wallets";
import type { LeaderboardEntry } from "@/lib/progress";

export function LeaderboardView() {
  const { evmWallet } = useMultichainWallets();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [contract, setContract] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/progress/leaderboard");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load leaderboard");
      setEntries(data.entries ?? []);
      setContract(data.contract ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const myAddress = evmWallet?.address?.toLowerCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#12182b] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">XP Leaderboard</h2>
            <p className="mt-1 text-sm text-slate-400">
              Live rankings from the LearnWeb3Progress contract
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          </div>
        )}

        {error && (
          <p className="mt-6 text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && entries.length === 0 && (
          <p className="mt-8 text-center text-sm text-slate-500">
            No learners on the board yet. Fund a wallet in chat to earn the
            first XP.
          </p>
        )}

        {!loading && entries.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-xl border border-white/5">
            <div className="grid grid-cols-[48px_1fr_80px_64px] gap-2 border-b border-white/5 bg-[#05070d] px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <span>#</span>
              <span>Learner</span>
              <span className="text-right">XP</span>
              <span className="text-right">Lvl</span>
            </div>
            <ul>
              {entries.map((entry) => {
                const isMe =
                  myAddress && entry.address.toLowerCase() === myAddress;
                return (
                  <li
                    key={entry.address}
                    className={`grid grid-cols-[48px_1fr_80px_64px] gap-2 border-b border-white/5 px-4 py-3 text-sm last:border-0 ${
                      isMe ? "bg-amber-500/10" : "bg-transparent"
                    }`}
                  >
                    <span
                      className={`font-semibold ${
                        entry.rank <= 3 ? "text-amber-400" : "text-slate-500"
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">
                        {entry.displayName || "Anonymous"}
                        {isMe ? " (you)" : ""}
                      </p>
                      <p className="font-mono text-xs text-slate-500">
                        {shortenAddress(entry.address, 4)}
                      </p>
                    </div>
                    <span className="text-right font-semibold text-white">
                      {entry.xp}
                    </span>
                    <span className="text-right text-slate-400">
                      {entry.level}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {contract && (
        <p className="text-center text-xs text-slate-500">
          Contract{" "}
          <a
            href={`https://sepolia.etherscan.io/address/${contract}`}
            target="_blank"
            rel="noreferrer"
            className="text-amber-400 underline"
          >
            {shortenAddress(contract, 6)}
          </a>{" "}
          · Ethereum Sepolia
        </p>
      )}
    </div>
  );
}
