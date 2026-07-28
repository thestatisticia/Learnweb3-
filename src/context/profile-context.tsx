"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMultichainWallets } from "@/hooks/use-multichain-wallets";
import { parseApiJson } from "@/lib/parse-api-json";
import type { OnChainProfile } from "@/lib/progress";

type ProfileContextValue = {
  profile: OnChainProfile | null;
  loading: boolean;
  error: string | null;
  needsName: boolean;
  refresh: () => Promise<void>;
  saveDisplayName: (name: string) => Promise<{ explorerUrl?: string }>;
  skipNamePrompt: () => void;
  namePromptOpen: boolean;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { evmWallet, authenticated } = useMultichainWallets();
  const address = evmWallet?.address as `0x${string}` | undefined;

  const [profile, setProfile] = useState<OnChainProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);

  const refresh = useCallback(async () => {
    if (!authenticated || !address) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/progress/profile?address=${address}`);
      const data = await parseApiJson<{ error?: string } & OnChainProfile>(res);
      if (!res.ok) throw new Error(data.error ?? "Failed to load profile");
      setProfile(data as OnChainProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [address, authenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveDisplayName = useCallback(
    async (name: string) => {
      if (!address) throw new Error("Wallet not ready");
      const trimmed = name.trim().slice(0, 32);
      if (!trimmed) throw new Error("Enter a display name");

      const res = await fetch("/api/progress/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, displayName: trimmed }),
      });
      const data = await parseApiJson<{ error?: string; explorerUrl?: string }>(
        res,
      );
      if (!res.ok) throw new Error(data.error ?? "Could not save name");
      await refresh();
      return { explorerUrl: data.explorerUrl };
    },
    [address, refresh],
  );

  const needsName =
    authenticated &&
    !!address &&
    !loading &&
    !profile?.displayName?.trim();

  const value = useMemo(
    () => ({
      profile,
      loading,
      error,
      needsName,
      refresh,
      saveDisplayName,
      skipNamePrompt: () => setSkipped(true),
      namePromptOpen: needsName && !skipped,
    }),
    [profile, loading, error, needsName, refresh, saveDisplayName, skipped],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return ctx;
}
