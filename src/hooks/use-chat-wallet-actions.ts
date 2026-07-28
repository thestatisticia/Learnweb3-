"use client";

import { useCallback } from "react";
import { baseSepolia } from "@/lib/chains";
import type { ChatMessage, MessageAction, WalletActionKind } from "@/lib/chat-types";
import {
  buildMintPreview,
  buildRegisterPreview,
  buildSendPreview,
  buildSwapPreview,
  executeMint,
  executeRegister,
  executeSend,
  executeSwap,
} from "@/lib/wallet-actions";
import { useEvmWalletClient } from "@/hooks/use-evm-wallet-client";

type UpdateMessage = (
  messageId: string,
  updater: (msg: ChatMessage) => ChatMessage,
) => void;

export function useChatWalletActions(
  updateMessage: UpdateMessage,
  onReflection: (reflection: string, xpMessage?: string) => void,
  refreshProfile: () => Promise<void>,
) {
  const { getClients, ready } = useEvmWalletClient();

  const loadPreview = useCallback(
    async (
      messageId: string,
      walletAction: WalletActionKind,
      registerName?: string,
    ) => {
      if (!ready) {
        updateMessage(messageId, (m) => ({
          ...m,
          action: m.action
            ? { ...m.action, status: "error", result: "Wallet not ready yet." }
            : m.action,
        }));
        return;
      }

      updateMessage(messageId, (m) => ({
        ...m,
        action: m.action ? { ...m.action, status: "loading" } : m.action,
      }));

      try {
        const chain = baseSepolia;
        const { publicClient, address } = await getClients(chain);

        const preview =
          walletAction === "send"
            ? await buildSendPreview(publicClient, address)
            : walletAction === "mint"
              ? await buildMintPreview(publicClient, address)
              : walletAction === "swap"
                ? await buildSwapPreview(publicClient, address)
              : await buildRegisterPreview(
                  publicClient,
                  address,
                  registerName ?? "Learner",
                );

        updateMessage(messageId, (m) => ({
          ...m,
          action: m.action
            ? {
                ...m.action,
                status: "ready",
                phase: "simulate",
                preview,
              }
            : m.action,
        }));
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Could not build preview";
        updateMessage(messageId, (m) => ({
          ...m,
          action: m.action
            ? { ...m.action, status: "error", result: msg }
            : m.action,
        }));
      }
    },
    [getClients, ready, updateMessage],
  );

  const advanceToConfirm = useCallback(
    (messageId: string) => {
      updateMessage(messageId, (m) => ({
        ...m,
        action: m.action
          ? { ...m.action, phase: "confirm", status: "ready" }
          : m.action,
      }));
    },
    [updateMessage],
  );

  const confirmWalletAction = useCallback(
    async (messageId: string, action: MessageAction) => {
      if (!action.walletAction || !ready) return;

      updateMessage(messageId, (m) => ({
        ...m,
        action: m.action ? { ...m.action, status: "loading" } : m.action,
      }));

      try {
        const walletAction = action.walletAction;
        const chain = baseSepolia;
        const { walletClient, publicClient, address } =
          await getClients(chain);

        const reflection =
          walletAction === "send"
            ? await executeSend(walletClient, publicClient, address)
            : walletAction === "mint"
              ? await executeMint(walletClient, publicClient, address)
              : walletAction === "swap"
                ? await executeSwap(walletClient, publicClient, address)
              : await executeRegister(
                  walletClient,
                  publicClient,
                  address,
                  action.registerName ?? "Learner",
                );

        updateMessage(messageId, (m) => ({
          ...m,
          content: `${m.content}\n\n**Transaction confirmed!** Your wallet signed successfully.`,
          action: m.action
            ? {
                ...m.action,
                status: "success",
                reflection,
              }
            : m.action,
        }));

        let xpMessage: string | undefined;

        if (walletAction === "send" || walletAction === "mint") {
          const res = await fetch("/api/progress/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address,
              action: walletAction,
              txHash: reflection.hash,
            }),
          });
          const data = await res.json();

          if (res.ok) {
            await refreshProfile();
            xpMessage = `**+${data.xpEarned} XP** earned on-chain!\nBadge unlocked: **${data.badge}**\nLevel **${data.profile.level}** · Total XP **${data.profile.xp}**`;
          } else if (res.status === 409) {
            xpMessage =
              "You've already claimed XP for this mission. Check **Profile** for your badges.";
          } else {
            xpMessage = `Transaction succeeded but XP recording failed: ${data.error ?? "unknown error"}. Your on-chain action is still valid.`;
          }
        } else if (walletAction === "register") {
          await refreshProfile();
          xpMessage =
            "Your learner name is registered on-chain. You're ready for **Mission 3: First Transfer** — say **\"Send test ETH\"**.";
        } else {
          xpMessage =
            "Swap complete! You just used a smart contract with a **wallet-confirmed** transaction. Ask me to explain what happened, or say **\"Start my next mission\"**.";
        }

        onReflection(reflection.whatHappened, xpMessage);
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Transaction failed";
        updateMessage(messageId, (m) => ({
          ...m,
          action: m.action
            ? { ...m.action, status: "error", result: msg }
            : m.action,
        }));
      }
    },
    [getClients, onReflection, ready, refreshProfile, updateMessage],
  );

  return {
    ready,
    loadPreview,
    advanceToConfirm,
    confirmWalletAction,
  };
}
