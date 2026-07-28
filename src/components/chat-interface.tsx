"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMultichainWallets } from "@/hooks/use-multichain-wallets";
import { useSelectedChain } from "@/context/chain-context";
import { APP_CHAINS, type AppChainId } from "@/lib/chains";
import { detectChainFromMessage, detectIntent, detectQuizLectureId } from "@/lib/intents";
import { getEvmBalance } from "@/lib/evm";
import { getStellarBalance } from "@/lib/stellar";
import { shortenAddress } from "@/lib/wallets";
import { getLecture, PASS_SCORE, type Lecture } from "@/lib/lectures";
import { useProfile } from "@/context/profile-context";
import type { ChatMessage, MessageAction } from "@/lib/chat-types";
import {
  getNextMission,
  getProactiveGreeting,
  MISSIONS,
  SWAP_RECEIVE_LEARN,
  type Mission,
} from "@/lib/missions";
import { checkHasMinted, checkHasSwapped } from "@/lib/wallet-actions";
import { baseSepolia } from "@/lib/chains";
import { createPublicClient, http } from "viem";
import { useEvmWalletClient } from "@/hooks/use-evm-wallet-client";
import { useChatWalletActions } from "@/hooks/use-chat-wallet-actions";
import {
  MissionActionCard,
  TxReflectionCard,
} from "@/components/mission-action-card";
import {
  ArrowUpIcon,
  BoltIcon,
  SparklesIcon,
  TargetIcon,
  WalletIcon,
} from "@/components/icons";

type QuizSession = {
  lecture: Lecture;
  index: number;
  score: number;
};

const SUGGESTION_CARDS: {
  prompt: string;
  title: string;
  description: string;
  icon: typeof WalletIcon;
}[] = [
  {
    prompt: "Start my next mission",
    title: "Next mission",
    description: "AI-guided on-chain practice",
    icon: TargetIcon,
  },
  {
    prompt: "What is a crypto wallet?",
    title: "What is a wallet?",
    description: "Learn the basics",
    icon: WalletIcon,
  },
  {
    prompt: "Send test ETH",
    title: "Send test ETH",
    description: "Wallet confirmation · +100 XP",
    icon: BoltIcon,
  },
  {
    prompt: "Mint my explorer badge",
    title: "Mint NFT badge",
    description: "Wallet confirmation · +150 XP",
    icon: SparklesIcon,
  },
  {
    prompt: "Swap ETH for LEARN",
    title: "Swap tokens",
    description: `Wallet confirmation · receive ${SWAP_RECEIVE_LEARN} LEARN`,
    icon: BoltIcon,
  },
];

type ChatInterfaceProps = {
  embedded?: boolean;
  initialPrompt?: string | null;
  onPromptConsumed?: () => void;
  displayName?: string | null;
};

export function ChatInterface({
  embedded = false,
  initialPrompt = null,
  onPromptConsumed,
  displayName = null,
}: ChatInterfaceProps) {
  const { selectedChain, setSelectedChain } = useSelectedChain();
  const {
    getWalletAddress,
    ensureStellarWallet,
    isCreatingStellar,
    evmWallet,
  } = useMultichainWallets();
  const { profile, refresh: refreshProfile } = useProfile();
  const { address: walletAddress } = useEvmWalletClient();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [hasMintedNft, setHasMintedNft] = useState(false);
  const [hasSwapped, setHasSwapped] = useState(false);
  const [missionBootstrapped, setMissionBootstrapped] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const consumedPrompt = useRef<string | null>(null);
  const hasStarted = messages.length > 0;
  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const xpIntoLevel = xp % 100;
  const xpProgress = Math.min(100, Math.round((xpIntoLevel / 100) * 100));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const addAssistant = useCallback((content: string, action?: MessageAction) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
        action,
      },
    ]);
  }, []);

  const updateMessage = useCallback(
    (messageId: string, updater: (msg: ChatMessage) => ChatMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? updater(m) : m)),
      );
    },
    [],
  );

  const onReflection = useCallback(
    (_whatHappened: string, xpMessage?: string) => {
      if (xpMessage) addAssistant(xpMessage);
    },
    [addAssistant],
  );

  const { loadPreview, advanceToConfirm, confirmWalletAction } =
    useChatWalletActions(updateMessage, onReflection, refreshProfile);

  const offerMission = useCallback(
    (mission: Mission, registerName?: string) => {
      const id = crypto.randomUUID();
      const content = `**${mission.title}** · ${mission.tier}\n\n${mission.explain}`;

      if (mission.action === "fund") {
        setMessages((prev) => [
          ...prev,
          {
            id,
            role: "assistant",
            content: `${content}\n\nClick below to receive testnet tokens (+${mission.xpReward} XP).`,
            action: { type: "fund", chain: "base", status: "ready" },
          },
        ]);
        return;
      }

      const walletAction =
        mission.action === "register"
          ? "register"
          : mission.action === "send"
            ? "send"
            : mission.action === "swap"
              ? "swap"
              : "mint";

      setMessages((prev) => [
        ...prev,
        {
          id,
          role: "assistant",
          content: `${content}\n\nI'll show a **practice preview** first, then you'll **confirm in your wallet**.`,
          action: {
            type: "wallet",
            walletAction,
            registerName,
            phase: "simulate",
            status: "ready",
          },
        },
      ]);

      void loadPreview(id, walletAction, registerName);
    },
    [loadPreview],
  );

  const awardXp = useCallback(
    async (action: "fund" | "send" | "lesson" | "quiz" | "mint") => {
      const address = evmWallet?.address;
      if (!address) return null;

      try {
        const res = await fetch("/api/progress/award", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, action }),
        });
        const data = await res.json();
        if (res.status === 409) {
          return { alreadyCompleted: true as const };
        }
        if (!res.ok) {
          throw new Error(data.error ?? "XP award failed");
        }
        return data as {
          message: string;
          xpEarned: number;
          badge: string;
          explorerUrl: string;
          profile: { xp: number; level: number };
        };
      } catch {
        return null;
      }
    },
    [evmWallet?.address],
  );

  const fetchBalance = useCallback(
    async (chain: AppChainId) => {
      const address = getWalletAddress(chain);
      if (!address) return "Wallet not ready yet.";

      try {
        if (chain === "stellar") {
          const bal = await getStellarBalance(address);
          return `You have **${bal} ${APP_CHAINS[chain].symbol}** on Stellar testnet.\n\nAddress: \`${shortenAddress(address, 8)}\``;
        }
        const bal = await getEvmBalance(chain, address as `0x${string}`);
        return `You have **${bal ?? "0"} ${APP_CHAINS[chain].symbol}** on ${APP_CHAINS[chain].label} testnet.\n\nAddress: \`${shortenAddress(address!, 8)}\``;
      } catch {
        return "Couldn't fetch balance. Your wallet may not be funded yet — try **\"Fund my wallet\"**.";
      }
    },
    [getWalletAddress],
  );

  const handleFund = useCallback(
    async (messageId: string, chain: AppChainId) => {
      if (chain === "stellar") {
        await ensureStellarWallet().catch(() => undefined);
      }

      const address = getWalletAddress(chain);
      if (!address) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId && m.action
              ? {
                  ...m,
                  action: {
                    ...m.action,
                    status: "error",
                    result: "Wallet not ready. Please wait a moment and try again.",
                  },
                }
              : m,
          ),
        );
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.action
            ? { ...m, action: { ...m.action, status: "loading" } }
            : m,
        ),
      );

      try {
        const response = await fetch("/api/faucet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chain, address }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Funding failed");
        }

        const explorerLine = data.explorerUrl
          ? "\n\nExplorer link saved in your activity."
          : "";

        // Prefer confirmed balance from faucet (waits for receipt). Fall back to a fresh read.
        let balanceLine: string;
        if (typeof data.balance === "string" && data.amount) {
          balanceLine = `You received **${data.amount} ${APP_CHAINS[chain].symbol}**.\n\nCurrent balance: **${data.balance} ${APP_CHAINS[chain].symbol}** on ${APP_CHAINS[chain].label} testnet.\n\nAddress: \`${shortenAddress(address, 8)}\``;
        } else if (chain === "stellar") {
          balanceLine = await fetchBalance(chain);
        } else {
          // Small delay + retry if RPC hasn't indexed yet
          await new Promise((r) => setTimeout(r, 1500));
          balanceLine = await fetchBalance(chain);
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId && m.action
              ? {
                  ...m,
                  content: `Done! Your ${APP_CHAINS[chain].label} testnet wallet has been funded.\n\n${balanceLine}${explorerLine}\n\nRecording your XP on Ethereum Sepolia…`,
                  action: {
                    ...m.action,
                    status: "success",
                    result: data.message,
                  },
                }
              : m,
          ),
        );

        const xp = await awardXp("fund");
        if (xp && "xpEarned" in xp) {
          await refreshProfile();
          addAssistant(
            `**+${xp.xpEarned} XP** earned on-chain!\nBadge unlocked: **${xp.badge}**\nLevel **${xp.profile.level}** · Total XP **${xp.profile.xp}**\n\nOpen **Profile** or **Leaderboard** to see your rank.`,
          );
        } else if (xp && "alreadyCompleted" in xp) {
          addAssistant(
            "You've already claimed the **Fund wallet** XP. Check **Profile** for your badges.",
          );
        } else {
          addAssistant(
            "Wallet funded. XP recording had an issue — try again later from Profile refresh after another action.",
          );
        }
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Could not fund wallet";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId && m.action
              ? {
                  ...m,
                  action: { ...m.action, status: "error", result: msg },
                }
              : m,
          ),
        );
      }
    },
    [
      addAssistant,
      awardXp,
      ensureStellarWallet,
      fetchBalance,
      getWalletAddress,
      refreshProfile,
    ],
  );

  const processMessage = useCallback(
    async (text: string) => {
      const intent = detectIntent(text);
      const chainHint = detectChainFromMessage(text);
      const chain = chainHint ?? selectedChain;

      if (chainHint) setSelectedChain(chainHint);

      switch (intent) {
        case "GREETING":
        case "MISSION": {
          const mission = getNextMission(profile, hasMintedNft, hasSwapped);
          if (mission) {
            addAssistant(
              getProactiveGreeting(profile, hasMintedNft, hasSwapped, displayName),
            );
            offerMission(mission, displayName ?? profile?.displayName ?? undefined);
          } else {
            addAssistant(
              getProactiveGreeting(profile, hasMintedNft, hasSwapped, displayName),
            );
          }
          return;
        }

        case "SWAP": {
          offerMission(MISSIONS.swap);
          return;
        }

        case "SEND": {
          offerMission(MISSIONS.send);
          return;
        }

        case "MINT": {
          offerMission(MISSIONS.mint);
          return;
        }

        case "FUND": {
          const id = crypto.randomUUID();
          const drip =
            chain === "base"
              ? "0.01 ETH"
              : chain === "celo"
                ? "0.1 CELO"
                : "test XLM via Friendbot";
          setMessages((prev) => [
            ...prev,
            {
              id,
              role: "assistant",
              content: `I'll fund your **${APP_CHAINS[chain].label}** testnet wallet with **${drip}**. You'll also earn **+50 XP** on-chain. Click below to confirm.`,
              action: { type: "fund", chain, status: "ready" },
            },
          ]);
          return;
        }

        case "BALANCE": {
          setIsThinking(true);
          const balanceText = await fetchBalance(chain);
          setIsThinking(false);
          addAssistant(balanceText);
          return;
        }

        case "SWITCH_CHAIN":
          addAssistant(
            chainHint
              ? `Switched to **${APP_CHAINS[chain].label}**. You can now fund your wallet or check your balance on this chain.`
              : "Which chain would you like to use? Pick **Base**, **Celo**, or **Stellar** from the selector above.",
          );
          return;

        case "LEARN": {
          addAssistant(
            "Open the **Lectures** tab for full Web3 lessons with quizzes.\n\nOr ask me anything about:\n• Wallets & keys\n• Transactions & gas\n• Base, Celo, Stellar\n• Security basics\n\nSay **\"Quiz me on wallets\"** to start a quick quiz here.",
          );
          return;
        }

        case "QUIZ": {
          const lectureId = detectQuizLectureId(text);
          const lecture = getLecture(lectureId ?? "wallets");
          if (!lecture) {
            addAssistant("Pick a topic: wallets, transactions, chains, or security.");
            return;
          }
          const q = lecture.quiz[0];
          setQuizSession({ lecture, index: 0, score: 0 });
          const id = crypto.randomUUID();
          setMessages((prev) => [
            ...prev,
            {
              id,
              role: "assistant",
              content: `Quiz: **${lecture.title}**\n\nQuestion 1/${lecture.quiz.length}\n\n${q.prompt}`,
              action: {
                type: "quiz",
                status: "ready",
                quizOptions: [...q.options],
                quizQuestionIndex: 0,
              },
            },
          ]);
          return;
        }

        default: {
          if (/finished the lesson|completed the lesson|i finished|lesson done/.test(text.toLowerCase())) {
            setIsThinking(true);
            const xp = await awardXp("lesson");
            setIsThinking(false);
            if (xp && "xpEarned" in xp) {
              addAssistant(
                `Lesson complete! **+${xp.xpEarned} XP** · Badge: **${xp.badge}**\nLevel **${xp.profile.level}** · Total **${xp.profile.xp} XP**`,
              );
            } else if (xp && "alreadyCompleted" in xp) {
              addAssistant("You already claimed the lesson XP. Nice work!");
            } else {
              addAssistant("Couldn't record lesson XP yet. Fund your wallet first, then try again.");
            }
            return;
          }

          setIsThinking(true);
          const history = messages
            .filter((m) => m.id !== "welcome")
            .map((m) => ({ role: m.role, content: m.content }));

          try {
            const response = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: text, history }),
            });
            const data = await response.json();
            addAssistant(
              data.reply ??
                "I'm here to help! Try the Lectures tab or say \"Fund my wallet\".",
            );
          } catch {
            addAssistant(
              "Something went wrong. Try **\"Fund my wallet\"** or open **Lectures**.",
            );
          } finally {
            setIsThinking(false);
          }
        }
      }
    },
    [
      addAssistant,
      awardXp,
      displayName,
      fetchBalance,
      hasMintedNft,
      hasSwapped,
      messages,
      offerMission,
      profile,
      selectedChain,
      setSelectedChain,
    ],
  );

  const handleSend = async (text: string) => {
    if (!text.trim() || isThinking) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text.trim() },
    ]);
    setInput("");
    await processMessage(text.trim());
  };

  const handleQuizAnswer = useCallback(
    async (messageId: string, optionIndex: number) => {
      if (!quizSession) return;
      const { lecture, index, score } = quizSession;
      const question = lecture.quiz[index];
      const correct = optionIndex === question.correctIndex;
      const nextScore = score + (correct ? 1 : 0);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.action
            ? {
                ...m,
                action: { ...m.action, status: "success" },
                content: `${m.content}\n\nYou chose **${String.fromCharCode(65 + optionIndex)}**. ${
                  correct ? "Correct!" : "Not quite."
                }\n${question.explanation}`,
              }
            : m,
        ),
      );

      if (index + 1 >= lecture.quiz.length) {
        setQuizSession(null);
        const passed = nextScore >= PASS_SCORE;
        addAssistant(
          `Quiz finished: **${nextScore}/${lecture.quiz.length}**.\n\n${
            passed
              ? "You passed!"
              : `Need ${PASS_SCORE}/${lecture.quiz.length} to pass. Review Lectures and retry.`
          }`,
        );
        if (passed) {
          const xp = await awardXp("quiz");
          if (xp && "xpEarned" in xp) {
            await refreshProfile();
            addAssistant(
              `**+${xp.xpEarned} XP** · Badge: **${xp.badge}**`,
            );
          } else if (xp && "alreadyCompleted" in xp) {
            addAssistant("Quiz XP was already claimed earlier.");
          }
        }
        return;
      }

      const nextIndex = index + 1;
      const nextQ = lecture.quiz[nextIndex];
      setQuizSession({ lecture, index: nextIndex, score: nextScore });
      const id = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id,
          role: "assistant",
          content: `Question ${nextIndex + 1}/${lecture.quiz.length}\n\n${nextQ.prompt}`,
          action: {
            type: "quiz",
            status: "ready",
            quizOptions: [...nextQ.options],
            quizQuestionIndex: nextIndex,
          },
        },
      ]);
    },
    [addAssistant, awardXp, quizSession, refreshProfile],
  );

  useEffect(() => {
    if (!initialPrompt || consumedPrompt.current === initialPrompt) return;
    consumedPrompt.current = initialPrompt;
    onPromptConsumed?.();
    void handleSend(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  useEffect(() => {
    if (!walletAddress || !process.env.NEXT_PUBLIC_BADGE_CONTRACT) return;
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });
    void checkHasMinted(client, walletAddress).then(setHasMintedNft);
  }, [walletAddress, profile?.actions.mint]);

  useEffect(() => {
    if (!walletAddress || !process.env.NEXT_PUBLIC_SWAP_CONTRACT) return;
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });
    void checkHasSwapped(client, walletAddress).then(setHasSwapped);
  }, [walletAddress, messages.length]);

  useEffect(() => {
    if (
      missionBootstrapped ||
      initialPrompt ||
      !profile ||
      messages.length > 0
    ) {
      return;
    }

    setMissionBootstrapped(true);
    const mission = getNextMission(profile, hasMintedNft, hasSwapped);
    addAssistant(
      getProactiveGreeting(profile, hasMintedNft, hasSwapped, displayName),
    );
    if (mission) {
      offerMission(mission, displayName ?? profile.displayName ?? undefined);
    }
  }, [
    addAssistant,
    displayName,
    hasMintedNft,
    hasSwapped,
    initialPrompt,
    messages.length,
    missionBootstrapped,
    offerMission,
    profile,
  ]);

  return (
    <div
      className={`relative flex flex-col bg-[#05070d] ${embedded ? "h-full" : "h-dvh"}`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[28%] h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.14),transparent_70%)] blur-2xl" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      <div className="relative z-10 shrink-0 px-3 pb-2 pt-3 sm:px-6 sm:pt-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 sm:gap-3">
          <div className="inline-flex min-w-0 items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 sm:gap-2.5 sm:px-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-black">
              <SparklesIcon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 text-left leading-tight">
              <span className="block truncate text-sm font-semibold text-white">
                Web3 Mentor
              </span>
              <span className="block text-[11px] text-amber-300/70">AI Tutor</span>
            </span>
          </div>

          <div className="w-[112px] shrink-0 rounded-2xl border border-white/8 bg-white/[0.03] px-2.5 py-2 sm:w-auto sm:min-w-[140px] sm:px-3">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-medium text-amber-300">Lvl {level}</span>
              <span className="text-white/40">{xp} XP</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-[width] duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {!hasStarted ? (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-3 pb-8 sm:px-4 sm:pb-12">
          <div className="w-full max-w-xl py-4">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/20 to-orange-500/10 shadow-[0_0_40px_rgba(245,166,35,0.15)] sm:mb-5 sm:h-14 sm:w-14">
                <SparklesIcon className="h-6 w-6 text-amber-300 sm:h-7 sm:w-7" />
              </div>
              <h1 className="text-[1.45rem] font-semibold tracking-tight text-white sm:text-[2.1rem]">
                {displayName
                  ? `Ready to learn, ${displayName}?`
                  : "Learn Web3 by doing"}
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/50 sm:text-base">
                The AI that teaches you Web3 by letting you use Web3 — simulate,
                confirm in your wallet, earn XP.
              </p>
            </div>

            <ChatComposer
              input={input}
              setInput={setInput}
              disabled={isThinking}
              onSubmit={() => void handleSend(input)}
              className="mt-6 sm:mt-8"
            />

            <div className="mt-5 grid gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-3">
              {SUGGESTION_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.prompt}
                    type="button"
                    onClick={() => void handleSend(card.prompt)}
                    className="group flex items-start gap-3 rounded-2xl border border-white/8 bg-[#12182b]/70 p-3.5 text-left transition hover:border-amber-500/35 hover:bg-amber-500/[0.07] sm:p-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300 transition group-hover:bg-gradient-to-br group-hover:from-amber-500 group-hover:to-orange-500 group-hover:text-black sm:h-10 sm:w-10">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-white">
                        {card.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-white/40">
                        {card.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto max-w-2xl space-y-5 px-3 py-5 sm:px-6 sm:py-6">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isCreatingStellar={isCreatingStellar}
                  onFund={(id, chain) => void handleFund(id, chain)}
                  onQuizAnswer={(id, i) => void handleQuizAnswer(id, i)}
                  onWalletSimulateContinue={(id) => advanceToConfirm(id)}
                  onWalletConfirm={(id, action) =>
                    void confirmWalletAction(id, action)
                  }
                />
              ))}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="rounded-3xl border border-white/5 bg-[#141c2e] px-5 py-3.5">
                    <div className="flex items-center gap-2 text-sm text-white/45">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400 [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400 [animation-delay:300ms]" />
                      </span>
                      Thinking...
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="relative z-10 shrink-0 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-5">
            <div className="mx-auto max-w-2xl">
              <ChatComposer
                input={input}
                setInput={setInput}
                disabled={isThinking}
                onSubmit={() => void handleSend(input)}
              />
              <div className="mt-3 flex flex-wrap gap-2 px-1">
                {SUGGESTION_CARDS.map((card) => (
                  <button
                    key={card.prompt}
                    type="button"
                    onClick={() => void handleSend(card.prompt)}
                    className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[12px] text-white/40 transition hover:border-amber-500/30 hover:text-amber-300"
                  >
                    {card.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ChatComposer({
  input,
  setInput,
  disabled,
  onSubmit,
  className = "",
}: {
  input: string;
  setInput: (value: string) => void;
  disabled: boolean;
  onSubmit: () => void;
  className?: string;
}) {
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="rounded-[24px] border border-white/10 bg-[#12182b] p-2 shadow-[0_0_0_1px_rgba(245,166,35,0.06)] focus-within:border-amber-500/40 focus-within:ring-1 focus-within:ring-amber-500/20 sm:rounded-[28px]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about Web3..."
          className="w-full bg-transparent px-3.5 py-2.5 text-[15px] text-white placeholder:text-white/35 focus:outline-none sm:px-4 sm:py-3"
        />
        <div className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-1">
          <p className="hidden px-2 text-[11px] text-white/25 min-[420px]:block">
            Tip: try “Fund my wallet” or “Quiz me”
          </p>
          <p className="px-2 text-[11px] text-white/25 min-[420px]:hidden">
            Ask or practice
          </p>
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black transition hover:from-amber-400 hover:to-orange-400 disabled:opacity-35"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </form>
  );
}

function MessageBubble({
  msg,
  isCreatingStellar,
  onFund,
  onQuizAnswer,
  onWalletSimulateContinue,
  onWalletConfirm,
}: {
  msg: ChatMessage;
  isCreatingStellar: boolean;
  onFund: (messageId: string, chain: AppChainId) => void;
  onQuizAnswer: (messageId: string, optionIndex: number) => void;
  onWalletSimulateContinue: (messageId: string) => void;
  onWalletConfirm: (messageId: string, action: MessageAction) => void;
}) {
  return (
    <div
      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[92%] sm:max-w-[90%] ${
          msg.role === "user"
            ? "rounded-3xl rounded-br-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-[15px] font-medium text-black sm:px-5 sm:py-3.5"
            : "rounded-3xl rounded-bl-lg border border-white/8 bg-[#12182b]/95 px-4 py-3 text-[15px] leading-relaxed text-white/80 sm:px-5 sm:py-3.5"
        }`}
      >
        {msg.role === "assistant" && (
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
              <SparklesIcon className="h-3 w-3" />
            </span>
            <span className="leading-tight">
              <span className="block text-xs font-semibold text-amber-300">
                Web3 Mentor
              </span>
              <span className="block text-[10px] text-white/35">AI Tutor</span>
            </span>
          </div>
        )}
        <FormattedText text={msg.content} />

        {msg.action?.type === "wallet" &&
          msg.action.preview &&
          msg.action.status !== "success" && (
            <MissionActionCard
              preview={msg.action.preview}
              phase={msg.action.phase ?? "simulate"}
              status={msg.action.status}
              error={msg.action.result}
              onSimulateContinue={() => onWalletSimulateContinue(msg.id)}
              onConfirm={() => onWalletConfirm(msg.id, msg.action!)}
            />
          )}

        {msg.action?.type === "wallet" &&
          msg.action.status === "success" &&
          msg.action.reflection && (
            <TxReflectionCard reflection={msg.action.reflection} />
          )}

        {msg.action?.type === "fund" && msg.action.status !== "success" && (
          <div className="mt-3 rounded-2xl border border-amber-500/20 bg-[#0a0f1a] p-3">
            <p className="text-xs text-white/45">
              Chain: {APP_CHAINS[msg.action.chain!].label} testnet · +50 XP
            </p>
            <button
              type="button"
              disabled={msg.action.status === "loading" || isCreatingStellar}
              onClick={() => onFund(msg.id, msg.action!.chain!)}
              className="mt-2 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-sm font-semibold text-black transition hover:from-amber-400 hover:to-orange-400 disabled:opacity-50"
            >
              {msg.action.status === "loading"
                ? "Funding..."
                : `Fund ${APP_CHAINS[msg.action.chain!].symbol} wallet`}
            </button>
            {msg.action.status === "error" && msg.action.result && (
              <p className="mt-2 text-xs text-red-400">{msg.action.result}</p>
            )}
          </div>
        )}

        {msg.action?.type === "quiz" &&
          msg.action.status === "ready" &&
          msg.action.quizOptions && (
            <div className="mt-3 space-y-2">
              {msg.action.quizOptions.map((option, i) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onQuizAnswer(msg.id, i)}
                  className="flex w-full items-start gap-2 rounded-2xl border border-white/10 bg-[#05070d] px-3.5 py-2.5 text-left text-sm text-white/80 transition hover:border-amber-400/40"
                >
                  <span className="font-semibold text-amber-400">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <p className="whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs text-amber-300"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
