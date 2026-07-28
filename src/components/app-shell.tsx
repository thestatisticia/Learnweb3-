"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { ChainProvider, useSelectedChain } from "@/context/chain-context";
import { ProfileProvider, useProfile } from "@/context/profile-context";
import { ChatInterface } from "@/components/chat-interface";
import { LecturesView } from "@/components/views/lectures-view";
import { ProfileView } from "@/components/views/profile-view";
import { LeaderboardView } from "@/components/views/leaderboard-view";
import { NamePromptModal } from "@/components/name-prompt-modal";
import { ChainSelector } from "@/components/chain-selector";
import { UserMenu } from "@/components/user-menu";
import { LandingPage } from "@/components/landing-page";
import {
  BookIcon,
  ChatIcon,
  MenuIcon,
  PanelCollapseIcon,
  TrophyIcon,
  UserIcon,
  XIcon,
} from "@/components/icons";

export type AppTab = "chat" | "lectures" | "profile" | "leaderboard";

const NAV_ITEMS: {
  id: AppTab;
  label: string;
  icon: typeof ChatIcon;
}[] = [
  { id: "chat", label: "Chat", icon: ChatIcon },
  { id: "lectures", label: "Lectures", icon: BookIcon },
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "leaderboard", label: "Leaderboard", icon: TrophyIcon },
];

const TAB_TITLES: Record<AppTab, string> = {
  chat: "Chat",
  lectures: "Lectures",
  profile: "Profile",
  leaderboard: "Leaderboard",
};

function LogoMark({
  className = "h-8 w-8",
  gradId = "lw3",
}: {
  className?: string;
  gradId?: string;
}) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d={`M8 22c0-6 4-10 8-10s8 4 8 10`}
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

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05070d]">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
    </div>
  );
}

function SignInScreen() {
  return <LandingPage />;
}

function SidePanelBody({
  tab,
  onSelect,
  email,
  displayName,
  onLogout,
  collapsed,
  onToggleCollapse,
  showClose,
  onClose,
}: {
  tab: AppTab;
  onSelect: (tab: AppTab) => void;
  email?: string;
  displayName?: string | null;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  showClose?: boolean;
  onClose?: () => void;
}) {
  const identity = displayName?.trim() || email || "Account";

  return (
    <aside
      className={`flex h-full flex-col border-r border-white/8 bg-[#070b16] transition-[width] duration-200 ease-out ${
        collapsed ? "w-[72px]" : "w-[240px]"
      }`}
    >
      <div
        className={`flex h-14 shrink-0 items-center border-b border-white/8 ${
          collapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        <div className={`flex items-center gap-2.5 ${collapsed ? "" : "min-w-0"}`}>
          <LogoMark
            className="h-7 w-7 shrink-0"
            gradId={showClose ? "lw3-mobile" : "lw3-desktop"}
          />
          {!collapsed && (
            <span className="truncate text-sm font-semibold tracking-wide text-white">
              LearnWeb3
            </span>
          )}
        </div>
        {!collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/5 hover:text-white"
            aria-label="Collapse sidebar"
            title="Collapse"
          >
            <PanelCollapseIcon className="h-4 w-4" />
          </button>
        )}
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/5 hover:text-white"
            aria-label="Close menu"
          >
            <XIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {collapsed && onToggleCollapse && (
        <div className="flex justify-center border-b border-white/8 py-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
            aria-label="Expand sidebar"
            title="Expand"
          >
            <PanelCollapseIcon className="h-4 w-4 rotate-180" />
          </button>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-4">
        {NAV_ITEMS.map((item) => {
          const active = tab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              title={collapsed ? item.label : undefined}
              className={`group flex w-full items-center gap-3 rounded-full transition ${
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
              } ${
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-white/50 hover:bg-white/[0.04] hover:text-white/85"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  active
                    ? "bg-gradient-to-br from-amber-500 to-orange-500 text-black"
                    : "text-current"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              {!collapsed && (
                <span className="min-w-0 text-left">
                  <span className="block text-[15px] font-medium">{item.label}</span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/8 p-2.5">
        <div
          className={`mb-2 rounded-2xl bg-white/[0.03] ${
            collapsed ? "px-1 py-2" : "px-3 py-2.5"
          }`}
        >
          {!collapsed ? (
            <>
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/30">
                {displayName?.trim() ? "Learner" : "Signed in"}
              </p>
              <p className="mt-0.5 truncate text-sm text-white/75">{identity}</p>
              {displayName?.trim() && email ? (
                <p className="mt-0.5 truncate text-[11px] text-white/30">{email}</p>
              ) : null}
            </>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-300">
              {(displayName?.[0] ?? email?.[0] ?? "U").toUpperCase()}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className={`w-full rounded-full text-xs font-medium text-white/45 transition hover:bg-white/5 hover:text-white ${
            collapsed ? "px-2 py-2.5" : "px-3 py-2.5 text-left"
          }`}
          title="Sign out"
        >
          {collapsed ? "Out" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}

function SidePanel({
  tab,
  onChange,
  email,
  displayName,
  onLogout,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: {
  tab: AppTab;
  onChange: (tab: AppTab) => void;
  email?: string;
  displayName?: string | null;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const select = (id: AppTab) => {
    onChange(id);
    onCloseMobile();
  };

  return (
    <>
      <div className="hidden h-full shrink-0 md:block">
        <SidePanelBody
          tab={tab}
          onSelect={select}
          email={email}
          displayName={displayName}
          onLogout={onLogout}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </div>

      <div
        className={`fixed inset-0 z-40 md:hidden ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={onCloseMobile}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-y-0 left-0 shadow-2xl shadow-black/50 transition-transform duration-200 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidePanelBody
            tab={tab}
            onSelect={select}
            email={email}
            displayName={displayName}
            onLogout={onLogout}
            collapsed={false}
            showClose
            onClose={onCloseMobile}
          />
        </div>
      </div>
    </>
  );
}

function AuthenticatedApp() {
  const { logout, user } = usePrivy();
  const { profile } = useProfile();
  const { selectedChain, setSelectedChain } = useSelectedChain();
  const [tab, setTab] = useState<AppTab>("chat");
  const [chatPrompt, setChatPrompt] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const email = user?.email?.address ?? user?.google?.email;
  const displayName = profile?.displayName ?? null;

  const askInChat = (prompt: string) => {
    setChatPrompt(prompt);
    setTab("chat");
  };

  return (
    <div className="flex h-dvh max-h-dvh bg-[#05070d]">
      <NamePromptModal />
      <SidePanel
        tab={tab}
        onChange={setTab}
        email={email}
        displayName={displayName}
        onLogout={logout}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/8 bg-[#070b16]/80 px-3 backdrop-blur-xl sm:gap-3 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="shrink-0 rounded-lg p-2 text-white/70 transition hover:bg-white/5 hover:text-white md:hidden"
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-2 md:flex">
            <span className="text-sm font-medium text-white/50">
              {TAB_TITLES[tab]}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <ChainSelector
              selected={selectedChain}
              onSelect={setSelectedChain}
              compact
              dark
            />
          </div>

          <UserMenu displayName={displayName} email={email} />
        </header>

        <div className="min-h-0 flex-1 overflow-hidden pb-[env(safe-area-inset-bottom)]">
          {tab === "chat" && (
            <ChatInterface
              embedded
              displayName={displayName}
              initialPrompt={chatPrompt}
              onPromptConsumed={() => setChatPrompt(null)}
            />
          )}
          {tab === "lectures" && (
            <div className="h-full overflow-y-auto overscroll-contain p-3 sm:p-6">
              <LecturesView onAskInChat={askInChat} />
            </div>
          )}
          {tab === "profile" && (
            <div className="h-full overflow-y-auto overscroll-contain p-3 sm:p-6">
              <ProfileView />
            </div>
          )}
          {tab === "leaderboard" && (
            <div className="h-full overflow-y-auto overscroll-contain p-3 sm:p-6">
              <LeaderboardView />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppShell() {
  const { ready, authenticated } = usePrivy();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !ready) return <LoadingScreen />;
  if (!authenticated) return <SignInScreen />;

  return (
    <ChainProvider>
      <ProfileProvider>
        <AuthenticatedApp />
      </ProfileProvider>
    </ChainProvider>
  );
}
