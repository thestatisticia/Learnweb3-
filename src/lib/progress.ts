import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import progressAbiJson from "@/lib/abi/LearnWeb3Progress.json";

export const ethereumSepolia = defineChain({
  id: 11155111,
  name: "Ethereum Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://ethereum-sepolia-rpc.publicnode.com"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
  testnet: true,
});

export const PROGRESS_ACTIONS = {
  FUND: 1,
  SEND: 2,
  LESSON: 3,
  QUIZ: 4,
} as const;

export type ProgressActionId =
  (typeof PROGRESS_ACTIONS)[keyof typeof PROGRESS_ACTIONS];

export const ACTION_META: Record<
  ProgressActionId,
  { label: string; xp: number; badge: string }
> = {
  1: { label: "Fund wallet", xp: 50, badge: "Wallet Explorer" },
  2: { label: "Send tokens", xp: 100, badge: "Payment Pro" },
  3: { label: "Complete lesson", xp: 75, badge: "Web3 Beginner" },
  4: { label: "Pass quiz", xp: 75, badge: "Quiz Master" },
};

export const progressAbi = progressAbiJson.abi;

export function getProgressContractAddress(): Address {
  const address = process.env.NEXT_PUBLIC_PROGRESS_CONTRACT;
  if (!address) {
    throw new Error("NEXT_PUBLIC_PROGRESS_CONTRACT is not set");
  }
  return address as Address;
}

export function getProgressPublicClient() {
  return createPublicClient({
    chain: ethereumSepolia,
    transport: http(),
  });
}

export type OnChainProfile = {
  address: Address;
  xp: number;
  actionsCompleted: number;
  displayName: string;
  registered: boolean;
  actions: {
    fund: boolean;
    send: boolean;
    lesson: boolean;
    quiz: boolean;
  };
  badges: {
    walletExplorer: boolean;
    paymentPro: boolean;
    web3Beginner: boolean;
    quizMaster: boolean;
  };
  level: number;
  explorerUrl: string;
};

export function xpToLevel(xp: number) {
  return Math.floor(xp / 100) + 1;
}

export async function readProfile(user: Address): Promise<OnChainProfile> {
  const client = getProgressPublicClient();
  const address = getProgressContractAddress();

  const result = await client.readContract({
    address,
    abi: progressAbi,
    functionName: "getProfile",
    args: [user],
  });

  const [xp, actionsCompleted, displayName, registered, actionStatus, badgeStatus] =
    result as [
      bigint,
      bigint,
      string,
      boolean,
      readonly [boolean, boolean, boolean, boolean],
      readonly [boolean, boolean, boolean, boolean],
    ];

  const xpNum = Number(xp);

  return {
    address: user,
    xp: xpNum,
    actionsCompleted: Number(actionsCompleted),
    displayName: displayName || "",
    registered,
    actions: {
      fund: actionStatus[0],
      send: actionStatus[1],
      lesson: actionStatus[2],
      quiz: actionStatus[3],
    },
    badges: {
      walletExplorer: badgeStatus[0],
      paymentPro: badgeStatus[1],
      web3Beginner: badgeStatus[2],
      quizMaster: badgeStatus[3],
    },
    level: xpToLevel(xpNum),
    explorerUrl: `https://sepolia.etherscan.io/address/${address}`,
  };
}

export type LeaderboardEntry = {
  rank: number;
  address: Address;
  xp: number;
  displayName: string;
  level: number;
};

export async function readLeaderboard(): Promise<LeaderboardEntry[]> {
  const client = getProgressPublicClient();
  const address = getProgressContractAddress();

  const result = await client.readContract({
    address,
    abi: progressAbi,
    functionName: "getLeaderboard",
  });

  const [addrs, xps, names] = result as [
    readonly Address[],
    readonly bigint[],
    readonly string[],
  ];

  const entries = addrs.map((addr, i) => ({
    address: addr,
    xp: Number(xps[i]),
    displayName: names[i] || "",
    level: xpToLevel(Number(xps[i])),
  }));

  entries.sort((a, b) => b.xp - a.xp);

  return entries.map((entry, i) => ({
    ...entry,
    rank: i + 1,
  }));
}

export async function awardActionOnChain(
  user: Address,
  actionId: ProgressActionId,
  displayName?: string,
) {
  const key = process.env.FAUCET_PRIVATE_KEY;
  if (!key) {
    throw new Error("FAUCET_PRIVATE_KEY is required to award XP");
  }

  const account = privateKeyToAccount(key as Hex);
  const publicClient = getProgressPublicClient();
  const walletClient = createWalletClient({
    account,
    chain: ethereumSepolia,
    transport: http(),
  });
  const contract = getProgressContractAddress();

  if (displayName?.trim()) {
    const nameHash = await walletClient.writeContract({
      address: contract,
      abi: progressAbi,
      functionName: "setDisplayName",
      args: [user, displayName.trim().slice(0, 32)],
    });
    await publicClient.waitForTransactionReceipt({ hash: nameHash });
  }

  const hash = await walletClient.writeContract({
    address: contract,
    abi: progressAbi,
    functionName: "awardAction",
    args: [user, actionId],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error("Award transaction failed");
  }

  const profile = await readProfile(user);
  const meta = ACTION_META[actionId];

  return {
    transactionHash: hash,
    explorerUrl: `https://sepolia.etherscan.io/tx/${hash}`,
    xpEarned: meta.xp,
    badge: meta.badge,
    profile,
  };
}
