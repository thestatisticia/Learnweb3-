import { NextResponse } from "next/server";
import { getProgressContractAddress, readLeaderboard } from "@/lib/progress";

export async function GET() {
  try {
    const entries = await readLeaderboard();
    return NextResponse.json({
      contract: getProgressContractAddress(),
      network: "Ethereum Sepolia",
      entries,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load leaderboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
