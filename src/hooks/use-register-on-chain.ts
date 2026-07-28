"use client";

import { useCallback } from "react";
import { useEvmWalletClient } from "@/hooks/use-evm-wallet-client";
import { executeRegister } from "@/lib/wallet-actions";
import { baseSepolia } from "@/lib/chains";

export function useRegisterOnChain() {
  const { getClients, ready } = useEvmWalletClient();

  const registerOnChain = useCallback(
    async (displayName: string) => {
      if (!ready) {
        throw new Error("Wallet not ready");
      }

      const { walletClient, publicClient, address } =
        await getClients(baseSepolia);
      const reflection = await executeRegister(
        walletClient,
        publicClient,
        address,
        displayName,
      );

      return {
        explorerUrl: reflection.explorerUrl,
        hash: reflection.hash,
      };
    },
    [getClients, ready],
  );

  return { registerOnChain, ready };
}
