"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { AppChainId } from "@/lib/chains";

type ChainContextValue = {
  selectedChain: AppChainId;
  setSelectedChain: (chain: AppChainId) => void;
};

const ChainContext = createContext<ChainContextValue | null>(null);

export function ChainProvider({ children }: { children: ReactNode }) {
  const [selectedChain, setSelectedChain] = useState<AppChainId>("base");

  return (
    <ChainContext.Provider value={{ selectedChain, setSelectedChain }}>
      {children}
    </ChainContext.Provider>
  );
}

export function useSelectedChain() {
  const context = useContext(ChainContext);
  if (!context) {
    throw new Error("useSelectedChain must be used within ChainProvider");
  }
  return context;
}
