import { NextResponse } from "next/server";
import {
  getProgressContractAddress,
  getProgressPublicClient,
  progressAbi,
} from "@/lib/progress";
import { createWalletClient, http, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ethereumSepolia } from "@/lib/progress";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      address?: string;
      displayName?: string;
    };

    const { address, displayName } = body;
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: "Valid address required" }, { status: 400 });
    }
    if (!displayName?.trim()) {
      return NextResponse.json({ error: "displayName required" }, { status: 400 });
    }

    const key = process.env.FAUCET_PRIVATE_KEY;
    if (!key) {
      return NextResponse.json({ error: "Faucet key missing" }, { status: 501 });
    }

    const account = privateKeyToAccount(key as Hex);
    const walletClient = createWalletClient({
      account,
      chain: ethereumSepolia,
      transport: http(),
    });
    const publicClient = getProgressPublicClient();
    const contract = getProgressContractAddress();

    const hash = await walletClient.writeContract({
      address: contract,
      abi: progressAbi,
      functionName: "setDisplayName",
      args: [address as Address, displayName.trim().slice(0, 32)],
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return NextResponse.json({
      message: "Display name saved on-chain",
      transactionHash: hash,
      explorerUrl: `https://sepolia.etherscan.io/tx/${hash}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save name";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
