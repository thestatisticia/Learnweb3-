import type { OnChainProfile } from "@/lib/progress";

export type MissionAction = "fund" | "register" | "send" | "mint" | "swap";

export type Mission = {
  id: string;
  title: string;
  tier: string;
  intro: string;
  explain: string;
  action: MissionAction;
  xpReward?: number;
  cta: string;
};

export const SEND_AMOUNT_ETH = "0.0001";
export const SWAP_AMOUNT_ETH = "0.0001";
export const SWAP_RECEIVE_LEARN = "1";

export const MISSION_RECIPIENT =
  (process.env.NEXT_PUBLIC_MISSION_RECIPIENT as `0x${string}` | undefined) ??
  ("0xdbe3fCbE5c8a41882Fb464C7d2cE2DDAf42aFe4B" as const);

export const MISSIONS: Record<string, Mission> = {
  fund: {
    id: "fund",
    title: "Mission 1: Power Up",
    tier: "Explorer",
    intro: "Let's get testnet tokens so you can practice real transactions.",
    explain:
      "A faucet sends free test tokens to your wallet. This one is relayer-funded — no signature needed yet. After funding, you'll sign your own transactions.",
    action: "fund",
    xpReward: 50,
    cta: "Fund wallet",
  },
  register: {
    id: "register",
    title: "Mission 2: Claim Your Identity",
    tier: "Explorer",
    intro: "Every Web3 learner needs an on-chain identity. You'll sign this with your wallet.",
    explain:
      "Registering writes your display name to the LearnWeb3 progress contract on Base Sepolia. **You** pay a tiny gas fee and approve the transaction — that's how ownership works in Web3.",
    action: "register",
    cta: "Register on-chain",
  },
  send: {
    id: "send",
    title: "Mission 3: First Transfer",
    tier: "Builder",
    intro: "Time to send test ETH. We'll simulate it first, then you confirm in your wallet.",
    explain:
      "Sending tokens moves value from your wallet to another address. You'll sign the transaction with your private key (inside your embedded wallet). Nobody can move your funds without that signature.",
    action: "send",
    xpReward: 100,
    cta: "Send test ETH",
  },
  mint: {
    id: "mint",
    title: "Mission 4: Mint Explorer Badge",
    tier: "Collector",
    intro: "NFTs prove you completed a learning milestone. Let's mint your first one.",
    explain:
      "Minting creates a unique token tied to your wallet. This Explorer Badge is proof you learned to interact with a smart contract. You'll sign the mint transaction yourself.",
    action: "mint",
    xpReward: 150,
    cta: "Mint my badge",
  },
  swap: {
    id: "swap",
    title: "Mission 5: Make Your First Swap",
    tier: "Trader",
    intro: "Let's swap a tiny amount of test ETH for LEARN tokens.",
    explain:
      "Swapping means trading one asset for another through a smart contract. In this practice mission, you'll swap **0.0001 ETH** for **1 LEARN** on Base Sepolia. We'll simulate the outcome first, then you'll confirm the real transaction in your wallet.",
    action: "swap",
    cta: "Swap for LEARN",
  },
};

export function getNextMission(
  profile: OnChainProfile | null,
  hasMintedNft: boolean,
  hasSwapped: boolean,
): Mission | null {
  if (!profile?.actions.fund) return MISSIONS.fund;
  if (!profile.displayName?.trim()) return MISSIONS.register;
  if (!profile.actions.send) return MISSIONS.send;
  if (!hasMintedNft && !profile.actions.mint) return MISSIONS.mint;
  if (!hasSwapped) return MISSIONS.swap;
  return null;
}

export function getProactiveGreeting(
  profile: OnChainProfile | null,
  hasMintedNft: boolean,
  hasSwapped: boolean,
  displayName?: string | null,
): string {
  const mission = getNextMission(profile, hasMintedNft, hasSwapped);
  const name = displayName?.trim() || profile?.displayName?.trim();

  if (!mission) {
    return name
      ? `Welcome back, **${name}**! You've completed the core missions. Try **"Quiz me on wallets"** or ask me anything about DeFi and NFTs.`
      : "Welcome back! Core missions complete. Ask me anything or take a quiz for more XP.";
  }

  if (mission.id === "fund") {
    return name
      ? `Hey **${name}**! Ready for **${mission.title}**?\n\n${mission.intro}\n\nTap below to receive testnet tokens (+50 XP).`
      : `Welcome to LearnWeb3! Let's start **${mission.title}**.\n\n${mission.intro}`;
  }

  if (mission.id === "register") {
    return `Great progress! Next up: **${mission.title}**.\n\n${mission.intro}\n\nThis requires a **wallet signature** — your first step into on-chain identity.`;
  }

  if (mission.id === "send") {
    return `You're ready for **${mission.title}**!\n\n${mission.intro}\n\nWe'll show a practice preview first, then you'll **confirm in your wallet**.`;
  }

  if (mission.id === "mint") {
    return `Almost there — **${mission.title}**!\n\n${mission.intro}\n\nMint your Explorer Badge NFT with a wallet signature (+150 XP).`;
  }

  return `You're ready for **${mission.title}**!\n\n${mission.intro}\n\nWe'll preview the swap first, then you'll confirm it in your wallet like a real DeFi action.`;
}
