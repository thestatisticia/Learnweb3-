"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useCreateWallet } from "@privy-io/react-auth/extended-chains";
import { getEmbeddedEvmWallet, getStellarWallet } from "@/lib/wallets";
import type { AppChainId } from "@/lib/chains";

export function useMultichainWallets() {
  const { user, authenticated, ready } = usePrivy();
  const { createWallet } = useCreateWallet();
  const [isCreatingStellar, setIsCreatingStellar] = useState(false);
  const [stellarError, setStellarError] = useState<string | null>(null);

  const evmWallet = getEmbeddedEvmWallet(user);
  const stellarWallet = getStellarWallet(user);

  const ensureStellarWallet = useCallback(async () => {
    if (!authenticated || stellarWallet) return stellarWallet;

    setIsCreatingStellar(true);
    setStellarError(null);

    try {
      const { wallet } = await createWallet({ chainType: "stellar" });
      return wallet;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create Stellar wallet";
      setStellarError(message);
      throw error;
    } finally {
      setIsCreatingStellar(false);
    }
  }, [authenticated, createWallet, stellarWallet]);

  useEffect(() => {
    if (!ready || !authenticated || stellarWallet) return;
    void ensureStellarWallet().catch(() => undefined);
  }, [authenticated, ensureStellarWallet, ready, stellarWallet]);

  const getWalletAddress = useCallback(
    (chainId: AppChainId) => {
      if (chainId === "stellar") return stellarWallet?.address;
      return evmWallet?.address;
    },
    [evmWallet?.address, stellarWallet?.address],
  );

  return {
    ready,
    authenticated,
    user,
    evmWallet,
    stellarWallet,
    isCreatingStellar,
    stellarError,
    ensureStellarWallet,
    getWalletAddress,
  };
}
