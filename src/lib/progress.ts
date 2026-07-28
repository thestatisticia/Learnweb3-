import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "@/lib/chains";
import progressAbiJson from "@/lib/abi/LearnWeb3Progress.json";

export const progressChain = baseSepolia;

const progressExplorer =
  baseSepolia.blockExplorers?.default.url ?? "https://sepolia.basescan.org";

export const PROGRESS_ACTIONS = {
  FUND: 1,
  SEND: 2,
  LESSON: 3,
  QUIZ: 4,
  MINT: 5,
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
  5: { label: "Mint NFT badge", xp: 150, badge: "NFT Explorer" },
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
    chain: baseSepolia,
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
    mint: boolean;
  };
  badges: {
    walletExplorer: boolean;
    paymentPro: boolean;
    web3Beginner: boolean;
    quizMaster: boolean;
    nftExplorer: boolean;
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

  try {
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
        readonly boolean[],
        readonly boolean[],
      ];

    const xpNum = Number(xp);

    return {
      address: user,
      xp: xpNum,
      actionsCompleted: Number(actionsCompleted),
      displayName: displayName || "",
      registered,
      actions: {
        fund: actionStatus[0] ?? false,
        send: actionStatus[1] ?? false,
        lesson: actionStatus[2] ?? false,
        quiz: actionStatus[3] ?? false,
        mint: actionStatus[4] ?? false,
      },
      badges: {
        walletExplorer: badgeStatus[0] ?? false,
        paymentPro: badgeStatus[1] ?? false,
        web3Beginner: badgeStatus[2] ?? false,
        quizMaster: badgeStatus[3] ?? false,
        nftExplorer: badgeStatus[4] ?? false,
      },
      level: xpToLevel(xpNum),
      explorerUrl: `${progressExplorer}/address/${address}`,
    };
  } catch {
    return readProfileLegacy(client, address, user);
  }
}

async function readProfileLegacy(
  client: ReturnType<typeof getProgressPublicClient>,
  contract: Address,
  user: Address,
): Promise<OnChainProfile> {
  const result = await client.readContract({
    address: contract,
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
      mint: false,
    },
    badges: {
      walletExplorer: badgeStatus[0],
      paymentPro: badgeStatus[1],
      web3Beginner: badgeStatus[2],
      quizMaster: badgeStatus[3],
      nftExplorer: false,
    },
    level: xpToLevel(xpNum),
    explorerUrl: `${progressExplorer}/address/${contract}`,
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
    chain: baseSepolia,
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
    explorerUrl: `${progressExplorer}/tx/${hash}`,
    xpEarned: meta.xp,
    badge: meta.badge,
    profile,
  };
}
