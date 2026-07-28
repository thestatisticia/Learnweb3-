"use client";

import type { ReactNode } from "react";
import { AuthButtons, StartLearningButton } from "@/components/auth-buttons";
import {
  BoltIcon,
  BookIcon,
  ChatIcon,
  SparklesIcon,
  TargetIcon,
  TrophyIcon,
  WalletIcon,
} from "@/components/icons";

function LogoMark({
  className = "h-8 w-8",
  gradId = "lw3-landing",
}: {
  className?: string;
  gradId?: string;
}) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M8 22c0-6 4-10 8-10s8 4 8 10"
        stroke={`url(#${gradId})`}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M10 10c4-4 8-4 12 0"
        stroke={`url(#${gradId})`}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id={gradId} x1="8" y1="6" x2="24" y2="24">
          <stop stopColor="#FFE8A3" />
          <stop offset="0.5" stopColor="#F5A623" />
          <stop offset="1" stopColor="#FF7A1A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Ask",
    body: "The AI mentor explains wallets, gas, NFTs, and DeFi in plain language — then offers your next mission.",
    icon: ChatIcon,
  },
  {
    n: "02",
    title: "Simulate & sign",
    body: "Practice Mode shows balance before/after and gas. Then you confirm the real transaction in your wallet.",
    icon: TargetIcon,
  },
  {
    n: "03",
    title: "Reflect & earn",
    body: "The AI explains what your transaction did. XP, badges, and NFT proof land on-chain.",
    icon: TrophyIcon,
  },
];

const PATHS = [
  {
    title: "Explorer",
    body: "Fund wallet, register on-chain, send your first test ETH.",
    meta: "3 wallet confirmations",
  },
  {
    title: "Collector",
    body: "Mint your Explorer Badge NFT — proof you learned to interact with contracts.",
    meta: "Mission 4",
  },
  {
    title: "Builder",
    body: "Quizzes, lectures, and advanced missions as you level up.",
    meta: "Unlock at Level 3",
  },
];

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05070d] text-white">
      <div className="pointer-events-none absolute inset-0 hero-grid" />
      <div className="pointer-events-none absolute left-[15%] top-[18%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.18),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[10%] top-[40%] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.12),transparent_70%)] blur-3xl" />

      <div className="pointer-events-none absolute left-[6%] top-[28%] hidden animate-float lg:block">
        <GlassChip icon={<SparklesIcon className="h-3.5 w-3.5" />} label="AI Mentor" />
      </div>
      <div className="pointer-events-none absolute right-[8%] top-[34%] hidden animate-float-delayed lg:block">
        <GlassChip icon={<BoltIcon className="h-3.5 w-3.5" />} label="XP +50" />
      </div>
      <div className="pointer-events-none absolute left-[10%] top-[58%] hidden animate-float-slow xl:block">
        <GlassChip icon={<WalletIcon className="h-3.5 w-3.5" />} label="Testnet Mission" />
      </div>

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <LogoMark className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
          <span className="truncate text-sm font-semibold tracking-wide">
            LearnWeb3
          </span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-white/50 md:flex">
          <a href="#how" className="transition hover:text-white">
            How it works
          </a>
          <a href="#paths" className="transition hover:text-white">
            Paths
          </a>
          <a href="#preview" className="transition hover:text-white">
            Mentor
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <StartLearningButton variant="ghost">Log in</StartLearningButton>
          </div>
          <StartLearningButton className="!px-3.5 !py-2 text-xs sm:!px-4">
            Start free
          </StartLearningButton>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-12 pt-8 text-center sm:px-6 sm:pb-16 sm:pt-10 md:pt-16">
          <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-200 sm:text-xs">
            <SparklesIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Consumer AI · Learn Web3 by using Web3</span>
          </p>
          <h1 className="mx-auto mt-5 max-w-4xl text-[2rem] font-semibold leading-[1.1] tracking-tight text-white sm:mt-6 sm:text-5xl md:text-6xl">
            The AI that teaches you Web3 by{" "}
            <span className="gold-text">letting you use Web3</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/55 sm:mt-5 sm:text-lg">
            Ask a question, get a mission, simulate the transaction, confirm in
            your wallet — then earn XP and mint proof on testnet.
          </p>

          <div className="mx-auto mt-8 flex w-full max-w-md flex-col items-center gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <StartLearningButton className="w-full sm:w-auto !px-8 !py-3.5">
              Start learning free
            </StartLearningButton>
            <a
              href="#paths"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/15 px-8 py-3.5 text-sm font-medium text-white/80 transition hover:border-amber-400/40 hover:text-white sm:w-auto"
            >
              Explore curriculum
            </a>
          </div>
          <p className="mt-4 text-xs text-white/35">
            Email signup · No seed phrases on day one · Testnet only
          </p>

          {/* Product preview — conversation mock */}
          <div id="preview" className="mx-auto mt-14 max-w-4xl scroll-mt-24">
            <div className="rounded-[28px] border border-white/10 bg-[#0b1020]/80 p-3 shadow-[0_0_80px_rgba(245,166,35,0.08)] backdrop-blur-xl sm:p-4">
              <div className="overflow-hidden rounded-[22px] border border-white/8 bg-[#070b16]">
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-black">
                      <SparklesIcon className="h-3.5 w-3.5" />
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">
                        Web3 Mentor
                      </p>
                      <p className="text-[11px] text-amber-300/70">AI Tutor</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-left">
                    <p className="text-[10px] text-amber-300">Mission 4</p>
                    <p className="text-[11px] font-medium text-white/80">
                      Mint Explorer Badge
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-4 text-left sm:p-5">
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-medium text-black">
                    How do NFTs work?
                  </div>

                  <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-white/10 bg-[#12182b] px-4 py-3 text-sm leading-relaxed text-white/75">
                    NFTs prove ownership of a unique digital asset on-chain.
                    Want to mint your first one?
                    <span className="mt-2 block rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-center text-xs font-semibold text-black">
                      Mint My First NFT
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#0a0f1a] px-4 py-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-white/35">
                      Practice mode
                    </p>
                    <div className="mt-2 grid gap-1.5 text-xs">
                      <PreviewRow label="Balance before" value="0.0500 ETH" />
                      <PreviewRow label="Balance after" value="0.0498 ETH" />
                      <PreviewRow label="Est. gas" value="≈0.00002 ETH" />
                    </div>
                    <p className="mt-2 text-[11px] text-white/40">
                      Nothing has happened yet — ready for the real transaction?
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <WalletIcon className="h-4 w-4 text-violet-300" />
                      <p className="text-sm font-semibold text-white">
                        Confirm in wallet
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-white/45">
                      Base Sepolia · Mint Explorer Badge
                    </p>
                    <span className="mt-2 block rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-center text-xs font-semibold text-violet-200">
                      Approve
                    </span>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
                    <p className="text-xs font-semibold text-emerald-400">
                      Explorer Badge minted!
                    </p>
                    <p className="mt-1 text-sm text-white/70">
                      You signed your first NFT mint. +150 XP unlocked.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                        +150 XP
                      </span>
                      <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                        NFT Explorer badge
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              How it works
            </h2>
            <p className="mt-3 text-white/50">
              Question → AI explains → mission → simulate → wallet confirm →
              reflect → XP + NFT.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.n}
                  className="rounded-3xl border border-white/10 bg-[#0b1020]/70 p-6 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wide text-amber-400">
                      {step.n}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">
                    {step.body}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Paths */}
        <section id="paths" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Mission paths
            </h2>
            <p className="mt-3 text-white/50">
              Every path ends with something happening on-chain — with your
              wallet signature.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PATHS.map((path) => (
              <div
                key={path.title}
                className="rounded-3xl border border-white/10 bg-gradient-to-b from-amber-500/[0.08] to-transparent p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                  <BookIcon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {path.title}
                </h3>
                <p className="mt-2 text-sm text-white/50">{path.body}</p>
                <p className="mt-4 text-xs font-medium text-amber-300/80">
                  {path.meta}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="rounded-[28px] border border-amber-500/25 bg-gradient-to-br from-amber-500/15 via-[#0b1020] to-[#05070d] px-5 py-10 text-center sm:rounded-[32px] sm:px-10 sm:py-12">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
              Your AI-native Web3 assistant starts here
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/55">
              Sign in with email, get an embedded wallet, and complete your
              first mission in minutes — simulate first, sign when ready.
            </p>
            <div className="mx-auto mt-8 w-full max-w-sm">
              <AuthButtons />
              <p className="mt-4 text-xs text-white/35">
                Continue with email to open your mentor + wallet
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/8 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-white/35 sm:flex-row">
          <div className="flex items-center gap-2 text-white/60">
            <LogoMark className="h-6 w-6" gradId="lw3-footer" />
            LearnWeb3
          </div>
          <p>Learn · Practice · Earn · Testnet only</p>
        </div>
      </footer>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-white/40">{label}</span>
      <span className="font-medium text-white/75">{value}</span>
    </div>
  );
}

function GlassChip({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/70 shadow-lg backdrop-blur-xl">
      <span className="text-amber-300">{icon}</span>
      {label}
    </div>
  );
}

