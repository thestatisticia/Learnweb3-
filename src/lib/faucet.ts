import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  parseEther,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { APP_CHAINS, getEvmChain, type AppChainId } from "@/lib/chains";

/** How much each learner receives per claim */
export const FAUCET_AMOUNTS: Record<"base" | "celo", string> = {
  base: "0.01", // ETH on Base Sepolia
  celo: "0.1", // CELO on Celo Sepolia
};

/** One claim per address per chain every 24 hours */
const RATE_LIMIT_MS = 24 * 60 * 60 * 1000;

const lastClaim = new Map<string, number>();

function claimKey(chain: AppChainId, address: string) {
  return `${chain}:${address.toLowerCase()}`;
}

function getFaucetPrivateKey(): Hex {
  const key = process.env.FAUCET_PRIVATE_KEY;
  if (!key) {
    throw new Error(
      "FAUCET_PRIVATE_KEY is not set. Add it to .env.local and fund the faucet wallet.",
    );
  }
  if (!key.startsWith("0x") || key.length !== 66) {
    throw new Error("FAUCET_PRIVATE_KEY must be a 0x-prefixed 32-byte hex key");
  }
  return key as Hex;
}

export function getFaucetAddress() {
  return privateKeyToAccount(getFaucetPrivateKey()).address;
}

export async function getFaucetBalance(chainId: "base" | "celo") {
  const chain = getEvmChain(chainId);
  if (!chain) throw new Error("Unsupported chain");

  const client = createPublicClient({
    chain,
    transport: http(),
  });

  const balance = await client.getBalance({ address: getFaucetAddress() });
  return {
    address: getFaucetAddress(),
    balance: formatEther(balance),
    symbol: APP_CHAINS[chainId].symbol,
  };
}

export async function fundEvmWallet(
  chainId: "base" | "celo",
  toAddress: `0x${string}`,
) {
  const chain = getEvmChain(chainId);
  if (!chain) {
    throw new Error("Unsupported EVM chain");
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
    throw new Error("Invalid wallet address");
  }

  const key = claimKey(chainId, toAddress);
  const previous = lastClaim.get(key);
  if (previous && Date.now() - previous < RATE_LIMIT_MS) {
    const hoursLeft = Math.ceil(
      (RATE_LIMIT_MS - (Date.now() - previous)) / (60 * 60 * 1000),
    );
    throw new Error(
      `Already funded recently. Try again in about ${hoursLeft} hour(s).`,
    );
  }

  const amount = FAUCET_AMOUNTS[chainId];
  const account = privateKeyToAccount(getFaucetPrivateKey());

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const faucetBalance = await publicClient.getBalance({
    address: account.address,
  });
  const sendValue = parseEther(amount);

  if (faucetBalance < sendValue) {
    throw new Error(
      `Faucet is empty on ${APP_CHAINS[chainId].label}. Deposit more ${APP_CHAINS[chainId].symbol} to ${account.address}`,
    );
  }

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  const hash = await walletClient.sendTransaction({
    to: toAddress,
    value: sendValue,
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    confirmations: 1,
  });

  if (receipt.status !== "success") {
    throw new Error(
      `Funding transaction failed on ${APP_CHAINS[chainId].label}`,
    );
  }

  // Read confirmed balance after the drip lands
  const balanceWei = await publicClient.getBalance({ address: toAddress });
  const balance = formatEther(balanceWei);

  lastClaim.set(key, Date.now());

  return {
    chain: chainId,
    address: toAddress,
    amount,
    balance,
    symbol: APP_CHAINS[chainId].symbol,
    transactionHash: hash,
    explorerUrl: `${chain.blockExplorers?.default.url}/tx/${hash}`,
    message: `Sent ${amount} ${APP_CHAINS[chainId].symbol} on ${APP_CHAINS[chainId].label} testnet`,
  };
}
