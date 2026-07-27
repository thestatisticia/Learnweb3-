"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { baseSepolia, celoSepolia } from "@/lib/chains";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function AppPrivyProvider({ children }: { children: React.ReactNode }) {
  if (!appId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05070d] px-6">
        <div className="max-w-md rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
          <p className="text-sm font-medium text-amber-200">
            Missing{" "}
            <code className="rounded bg-amber-500/20 px-1.5 py-0.5">
              NEXT_PUBLIC_PRIVY_APP_ID
            </code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethodsAndOrder: {
          primary: ["email"],
        },
        appearance: {
          theme: "dark",
          accentColor: "#F5A623",
          logo: undefined,
          showWalletLoginFirst: false,
          walletChainType: "ethereum-only",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia, celoSepolia],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
