import { NextResponse } from "next/server";
import type { Address, Hash } from "viem";
import {
  ACTION_META,
  PROGRESS_ACTIONS,
  awardActionOnChain,
  type ProgressActionId,
} from "@/lib/progress";
import { verifyMintTransaction, verifySendTransaction } from "@/lib/tx-verify";

const ACTION_MAP: Record<string, ProgressActionId> = {
  send: PROGRESS_ACTIONS.SEND,
  mint: PROGRESS_ACTIONS.MINT,
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      address?: string;
      action?: string;
      txHash?: string;
    };

    const { address, action, txHash } = body;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: "Valid EVM address required" }, { status: 400 });
    }

    if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json({ error: "Valid txHash required" }, { status: 400 });
    }

    const actionId = action ? ACTION_MAP[action.toLowerCase()] : undefined;
    if (!actionId) {
      return NextResponse.json(
        { error: "action must be send | mint" },
        { status: 400 },
      );
    }

    const user = address as Address;
    const hash = txHash as Hash;

    if (action === "send") {
      const check = await verifySendTransaction(hash, user);
      if (!check.valid) {
        return NextResponse.json({ error: check.error ?? "Invalid send tx" }, { status: 400 });
      }
    } else {
      const check = await verifyMintTransaction(hash, user);
      if (!check.valid) {
        return NextResponse.json({ error: check.error ?? "Invalid mint tx" }, { status: 400 });
      }
    }

    const result = await awardActionOnChain(user, actionId);

    return NextResponse.json({
      message: `+${result.xpEarned} XP · Badge: ${result.badge}`,
      action,
      meta: ACTION_META[actionId],
      verified: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to verify and award XP";

    if (message.toLowerCase().includes("already completed")) {
      return NextResponse.json(
        { error: "Action already completed on-chain", alreadyCompleted: true },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
