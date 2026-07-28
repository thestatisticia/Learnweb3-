"use client";

import { useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
  type Chain,
} from "viem";

export function useEvmWalletClient() {
  const { wallets, ready } = useWallets();
  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");

  const getClients = useCallback(
    async (chain: Chain) => {
      if (!embeddedWallet) {
        throw new Error("Wallet not ready. Please wait a moment and try again.");
      }

      await embeddedWallet.switchChain(chain.id);
      const provider = await embeddedWallet.getEthereumProvider();

      const walletClient = createWalletClient({
        account: embeddedWallet.address as Address,
        chain,
        transport: custom(provider),
      });

      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });

      return {
        walletClient,
        publicClient,
        address: embeddedWallet.address as Address,
      };
    },
    [embeddedWallet],
  );

  return {
    ready: ready && !!embeddedWallet,
    address: embeddedWallet?.address as Address | undefined,
    getClients,
  };
}
