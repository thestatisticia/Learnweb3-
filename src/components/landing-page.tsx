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
    title: "Learn",
    body: "Ask the AI mentor anything — wallets, gas, chains, and security — in plain language.",
    icon: ChatIcon,
  },
  {
    n: "02",
    title: "Practice",
    body: "Complete real testnet missions: fund a wallet, take quizzes, and try guided actions.",
    icon: TargetIcon,
  },
  {
    n: "03",
    title: "Earn",
    body: "Collect on-chain XP, unlock badges, and climb the leaderboard as you progress.",
    icon: TrophyIcon,
  },
];

const PATHS = [
  {
    title: "Beginner",
    body: "Wallets, transactions, and your first testnet drip.",
    meta: "4 lessons",
  },
  {
    title: "Builder",
    body: "Chains, security habits, and guided practice missions.",
    meta: "Coming next",
  },
  {
    title: "DeFi & Beyond",
    body: "Tokens, contracts, and advanced Web3 workflows.",
    meta: "Locked path",
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

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <LogoMark />
          <span className="text-sm font-semibold tracking-wide">LearnWeb3</span>
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
        <div className="flex items-center gap-2">
          <StartLearningButton variant="ghost">Log in</StartLearningButton>
          <StartLearningButton className="!px-4 !py-2 text-xs">
            Start free
          </StartLearningButton>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 text-center md:pt-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
            <SparklesIcon className="h-3.5 w-3.5" />
            Your AI mentor for learning Web3
          </p>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl">
            Learn Web3 the way you{" "}
            <span className="gold-text">actually remember it</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
            Lessons, quizzes, and an AI mentor that guides you step by step —
            then you practice with real testnet actions and earn XP as you grow.
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

          {/* Product preview */}
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
                    <p className="text-[10px] text-amber-300">Level 3</p>
                    <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-4 text-left sm:grid-cols-[1.2fr_0.8fr] sm:p-5">
                  <div className="space-y-3">
                    <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-medium text-black">
                      Explain Ethereum gas fees
                    </div>
                    <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-white/10 bg-[#12182b] px-4 py-3 text-sm leading-relaxed text-white/75">
                      Gas is the fee paid to process your transaction — like
                      postage. Busier networks cost more. On LearnWeb3 testnets,
                      you practice with free tokens.
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/30">
                      Ask anything about Web3...
                    </div>
                  </div>

                  <div className="space-y-3">
                    <StatCard label="XP" value="420" />
                    <StatCard label="Missions" value="12 done" />
                    <StatCard label="Badge" value="Explorer" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              How it works
            </h2>
            <p className="mt-3 text-white/50">
              A simple loop: learn with AI, practice on-chain, earn progress you
              can prove.
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
        <section id="paths" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Learning paths
            </h2>
            <p className="mt-3 text-white/50">
              Start with foundations. Unlock builder and DeFi tracks as you
              level up.
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
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-[32px] border border-amber-500/25 bg-gradient-to-br from-amber-500/15 via-[#0b1020] to-[#05070d] px-6 py-12 text-center sm:px-10">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Become a Web3 builder — one mission at a time
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/55">
              Built for beginners, students, and developers who want practice,
              not another wall of docs.
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

      <footer className="relative z-10 border-t border-white/8 px-6 py-8">
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-white/35">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
