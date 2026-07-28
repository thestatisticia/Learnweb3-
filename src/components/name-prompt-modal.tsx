"use client";

import { useState, type FormEvent } from "react";
import { useProfile } from "@/context/profile-context";
import { useMultichainWallets } from "@/hooks/use-multichain-wallets";
import { shortenAddress } from "@/lib/wallets";

export function NamePromptModal() {
  const { namePromptOpen, saveDisplayName, skipNamePrompt } = useProfile();
  const { evmWallet } = useMultichainWallets();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txUrl, setTxUrl] = useState<string | null>(null);

  if (!namePromptOpen) return null;

  const address = evmWallet?.address;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setTxUrl(null);
    try {
      const result = await saveDisplayName(name);
      if (result.explorerUrl) setTxUrl(result.explorerUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save name");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1020] p-6 shadow-2xl shadow-black/50 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-amber-400/80">
          On-chain identity
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Choose your learner name
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          This name is linked to your wallet on Base Sepolia. We save it
          on-chain for you — no gas or wallet signature needed here.
        </p>

        {address && (
          <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/35">
              Wallet
            </p>
            <p className="mt-1 font-mono text-sm text-amber-200/90">
              {shortenAddress(address, 8)}
            </p>
          </div>
        )}

        <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-4">
          <div>
            <label htmlFor="display-name" className="text-xs font-medium text-white/50">
              Display name
            </label>
            <input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              autoFocus
              placeholder="e.g. polo.eth learner"
              className="mt-2 w-full rounded-full border border-white/10 bg-[#05070d] px-5 py-3.5 text-base text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
            <p className="mt-2 text-[11px] text-white/30">{name.trim().length}/32</p>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {txUrl && (
            <p className="text-sm text-emerald-400">
              Saved on-chain.{" "}
              <a href={txUrl} target="_blank" rel="noreferrer" className="underline">
                View tx
              </a>
            </p>
          )}

          <button
            type="submit"
            disabled={saving || !name.trim() || !address}
            className="w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-semibold text-black transition hover:from-amber-400 hover:to-orange-400 disabled:opacity-40"
          >
            {saving ? "Saving on-chain…" : "Save display name"}
          </button>
        </form>

        <button
          type="button"
          onClick={skipNamePrompt}
          className="mt-4 w-full py-2 text-sm text-white/40 transition hover:text-white/70"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
