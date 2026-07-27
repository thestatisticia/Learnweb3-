import { NextResponse } from "next/server";
import { fundStellarTestnetWallet } from "@/lib/stellar";
import { fundEvmWallet, getFaucetAddress, getFaucetBalance } from "@/lib/faucet";
import { APP_CHAINS, type AppChainId } from "@/lib/chains";

type FaucetRequest = {
  chain: AppChainId;
  address: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get("chain") as "base" | "celo" | null;

    if (chain === "base" || chain === "celo") {
      const status = await getFaucetBalance(chain);
      return NextResponse.json(status);
    }

    return NextResponse.json({
      faucetAddress: getFaucetAddress(),
      chains: {
        base: FAUCET_CHAIN_INFO.base,
        celo: FAUCET_CHAIN_INFO.celo,
      },
      note: "Deposit testnet tokens to this address so LearnWeb3 can fund learners.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not read faucet status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const FAUCET_CHAIN_INFO = {
  base: {
    network: "Base Sepolia",
    symbol: "ETH",
    drip: "0.01 ETH",
    fundFrom: "https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet",
  },
  celo: {
    network: "Celo Sepolia",
    symbol: "CELO",
    drip: "0.1 CELO",
    fundFrom: "https://faucet.celo.org",
  },
} as const;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FaucetRequest;
    const { chain, address } = body;

    if (!chain || !address) {
      return NextResponse.json(
        { error: "chain and address are required" },
        { status: 400 },
      );
    }

    if (!(chain in APP_CHAINS)) {
      return NextResponse.json({ error: "Unsupported chain" }, { status: 400 });
    }

    if (chain === "stellar") {
      const result = await fundStellarTestnetWallet(address);
      return NextResponse.json({
        chain,
        address,
        message: "Stellar testnet wallet funded via Friendbot",
        result,
      });
    }

    const result = await fundEvmWallet(chain, address as `0x${string}`);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Faucet request failed";
    const status = message.includes("not set")
      ? 501
      : message.includes("Already funded")
        ? 429
        : message.includes("empty")
          ? 503
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
