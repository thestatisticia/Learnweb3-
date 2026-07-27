import { NextResponse } from "next/server";
import {
  ACTION_META,
  PROGRESS_ACTIONS,
  awardActionOnChain,
  type ProgressActionId,
} from "@/lib/progress";
import type { Address } from "viem";

const ACTION_MAP: Record<string, ProgressActionId> = {
  fund: PROGRESS_ACTIONS.FUND,
  send: PROGRESS_ACTIONS.SEND,
  lesson: PROGRESS_ACTIONS.LESSON,
  quiz: PROGRESS_ACTIONS.QUIZ,
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      address?: string;
      action?: string;
      displayName?: string;
    };

    const { address, action, displayName } = body;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: "Valid EVM address required" }, { status: 400 });
    }

    const actionId = action ? ACTION_MAP[action.toLowerCase()] : undefined;
    if (!actionId) {
      return NextResponse.json(
        { error: "action must be fund | send | lesson | quiz" },
        { status: 400 },
      );
    }

    const result = await awardActionOnChain(
      address as Address,
      actionId,
      displayName,
    );

    return NextResponse.json({
      message: `+${result.xpEarned} XP · Badge: ${result.badge}`,
      action,
      meta: ACTION_META[actionId],
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to award XP";

    // Already completed is expected on retries
    if (message.toLowerCase().includes("already completed")) {
      return NextResponse.json(
        { error: "Action already completed on-chain", alreadyCompleted: true },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
