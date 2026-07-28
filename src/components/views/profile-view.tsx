"use client";

import { useEffect, useMemo, useState } from "react";
import { useMultichainWallets } from "@/hooks/use-multichain-wallets";
import { useProfile } from "@/context/profile-context";
import { shortenAddress } from "@/lib/wallets";
import type { OnChainProfile } from "@/lib/progress";
import {
  LEARNING_PATHS,
  LECTURES,
  lecturesByPath,
  upcomingByPath,
} from "@/lib/lectures";
import { getLectureProgress } from "@/lib/lecture-progress";
import {
  BoltIcon,
  BookIcon,
  CheckCircleIcon,
  CopyIcon,
  ExternalLinkIcon,
  LockIcon,
  SparklesIcon,
  TrophyIcon,
  WalletIcon,
} from "@/components/icons";

const BADGE_LIST = [
  {
    key: "walletExplorer",
    label: "Wallet Explorer",
    action: "Fund wallet",
    icon: WalletIcon,
  },
  {
    key: "paymentPro",
    label: "Payment Pro",
    action: "Send tokens",
    icon: BoltIcon,
  },
  {
    key: "web3Beginner",
    label: "Web3 Beginner",
    action: "Complete lesson",
    icon: BookIcon,
  },
  {
    key: "quizMaster",
    label: "Quiz Master",
    action: "Pass quiz",
    icon: TrophyIcon,
  },
  {
    key: "nftExplorer",
    label: "NFT Explorer",
    action: "Mint badge",
    icon: SparklesIcon,
  },
] as const;

export function ProfileView() {
  const { evmWallet, authenticated } = useMultichainWallets();
  const { profile, loading, error, refresh, saveDisplayName } = useProfile();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [txUrl, setTxUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lectureProgress, setLectureProgress] = useState(
    {} as ReturnType<typeof getLectureProgress>,
  );

  const address = evmWallet?.address as `0x${string}` | undefined;

  useEffect(() => {
    if (profile?.displayName) {
      setDisplayName(profile.displayName);
    }
  }, [profile?.displayName]);

  useEffect(() => {
    if (!address) return;
    setLectureProgress(getLectureProgress(address));
  }, [address, profile?.actionsCompleted]);

  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const xpIntoLevel = xp % 100;
  const xpProgress = Math.min(100, Math.round((xpIntoLevel / 100) * 100));
  const badgesUnlocked = profile
    ? Object.values(profile.badges).filter(Boolean).length
    : 0;
  const lessonsCompleted = Object.keys(lectureProgress).length;

  const pathProgress = useMemo(() => {
    return LEARNING_PATHS.map((path) => {
      const live = lecturesByPath(path.id);
      const upcoming = upcomingByPath(path.id);
      const done = live.filter((l) => lectureProgress[l.id]?.completedAt).length;
      const total = live.length + upcoming.length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      return { ...path, done, total, pct };
    });
  }, [lectureProgress]);

  const activity = useMemo(() => {
    const items: { title: string; detail: string; xp: string }[] = [];
    if (profile?.actions.fund) {
      items.push({
        title: "Funded wallet",
        detail: "Testnet faucet claim",
        xp: "+50 XP",
      });
    }
    if (profile?.actions.quiz) {
      items.push({
        title: "Passed a quiz",
        detail: "On-chain Quiz Master progress",
        xp: "+75 XP",
      });
    }
    if (profile?.actions.send) {
      items.push({
        title: "Sent test ETH",
        detail: "Wallet-signed transfer",
        xp: "+100 XP",
      });
    }
    if (profile?.actions.mint) {
      items.push({
        title: "Minted Explorer Badge",
        detail: "Wallet-signed NFT mint",
        xp: "+150 XP",
      });
    }
    if (profile?.actions.lesson) {
      items.push({
        title: "Completed a lesson",
        detail: "Lesson action recorded",
        xp: "+75 XP",
      });
    }
    for (const lecture of LECTURES) {
      const done = lectureProgress[lecture.id];
      if (done?.completedAt) {
        items.push({
          title: `Completed ${lecture.title}`,
          detail: new Date(done.completedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          xp: `+${lecture.xpReward} XP`,
        });
      }
    }
    return items.slice(0, 6);
  }, [profile, lectureProgress]);

  if (!authenticated) return null;

  if (!address) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#12182b] p-8 text-center text-sm text-white/45">
        Creating your EVM wallet…
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  const saveName = async () => {
    setSaving(true);
    setSaveError(null);
    setTxUrl(null);
    try {
      const result = await saveDisplayName(displayName);
      if (result.explorerUrl) setTxUrl(result.explorerUrl);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save name");
    } finally {
      setSaving(false);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#12182b] p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">
          Profile
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {profile?.displayName || "Anonymous learner"}
        </h2>

        <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-amber-200">Level {level}</p>
            <p className="text-xs text-white/45">
              {xpIntoLevel} / 100 XP to next
            </p>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-[width] duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/40">{xp} total XP</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "XP", value: xp },
            { label: "Lessons", value: lessonsCompleted },
            { label: "Quizzes", value: profile?.actions.quiz ? 1 : 0 },
            { label: "Badges", value: badgesUnlocked },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/5 bg-[#05070d] p-3.5"
            >
              <p className="text-[11px] text-white/40">{stat.label}</p>
              <p className="mt-1 text-xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <label className="text-xs font-medium text-white/45">
            Display name (on-chain)
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={32}
              placeholder="Choose a name"
              className="w-full flex-1 rounded-full border border-white/10 bg-[#05070d] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-amber-500/40 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void saveName()}
              disabled={saving || !displayName.trim()}
              className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-black hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 sm:shrink-0"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
          {txUrl && (
            <p className="mt-2 text-xs text-emerald-400">
              Saved.{" "}
              <a href={txUrl} target="_blank" rel="noreferrer" className="underline">
                View transaction
              </a>
            </p>
          )}
        </div>

        {(error || saveError) && (
          <p className="mt-4 text-sm text-red-400">{saveError || error}</p>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#12182b] p-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">
          Connected wallet
        </p>
        <p className="mt-2 font-mono text-sm text-white sm:text-base">
          {shortenAddress(address, 8)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyAddress()}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/70 transition hover:border-amber-500/30 hover:text-amber-200"
          >
            <CopyIcon className="h-3.5 w-3.5" />
            {copied ? "Copied" : "Copy"}
          </button>
          <a
            href={`https://sepolia.basescan.org/address/${address}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/70 transition hover:border-amber-500/30 hover:text-amber-200"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
            Explorer
          </a>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#12182b] p-6">
        <h3 className="text-lg font-semibold text-white">Learning progress</h3>
        <div className="mt-4 space-y-4">
          {pathProgress.map((path) => (
            <div key={path.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white/85">{path.title}</p>
                <p className="text-xs text-white/40">
                  {path.done}/{path.total}
                  {path.pct === 0 ? " · Not started" : ` · ${path.pct}%`}
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                  style={{ width: `${path.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#12182b] p-6">
        <h3 className="text-lg font-semibold text-white">Badges</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {BADGE_LIST.map((badge) => {
            const unlocked =
              profile?.badges[badge.key as keyof OnChainProfile["badges"]];
            const Icon = badge.icon;
            return (
              <div
                key={badge.key}
                className={`rounded-2xl border p-4 ${
                  unlocked
                    ? "border-amber-500/30 bg-amber-500/10"
                    : "border-white/5 bg-[#05070d] opacity-65"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      unlocked
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 text-black"
                        : "bg-white/5 text-white/35"
                    }`}
                  >
                    {unlocked ? (
                      <Icon className="h-4 w-4" />
                    ) : (
                      <LockIcon className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{badge.label}</p>
                    <p className="mt-0.5 text-xs text-white/40">{badge.action}</p>
                    <p className="mt-2 text-xs font-medium text-amber-400">
                      {unlocked ? "Unlocked" : "Locked"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#12182b] p-6">
        <h3 className="text-lg font-semibold text-white">Recent activity</h3>
        {activity.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">
            Fund a wallet, pass a quiz, or finish a lesson to start your history.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {activity.map((item) => (
              <div
                key={`${item.title}-${item.detail}`}
                className="flex items-start justify-between gap-3 rounded-2xl border border-white/5 bg-[#05070d] px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs text-white/40">{item.detail}</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-medium text-amber-300">
                  {item.xp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#12182b] p-5 text-sm text-white/45">
        <div className="flex items-start gap-2">
          <SparklesIcon className="mt-0.5 h-4 w-4 text-amber-400" />
          <p>
            Progress XP & badges live on{" "}
            <span className="text-amber-400">Ethereum Sepolia</span>. Lesson
            completion is tracked locally per wallet and shown in Learning
            progress.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-3 text-xs font-medium text-amber-400 hover:text-amber-300"
        >
          Refresh profile
        </button>
      </div>
    </div>
  );
}
