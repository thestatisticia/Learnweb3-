import { defineChain, type Chain } from "viem";

export type AppChainId = "base" | "celo" | "stellar";

export const baseSepolia = defineChain({
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://sepolia.base.org"] },
  },
  blockExplorers: {
    default: { name: "BaseScan", url: "https://sepolia.basescan.org" },
  },
  testnet: true,
});

export const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://forno.celo-sepolia.celo-testnet.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://celo-sepolia.blockscout.com",
    },
  },
  testnet: true,
});

export const STELLAR_TESTNET = {
  horizonUrl: "https://horizon-testnet.stellar.org",
  friendbotUrl: "https://friendbot.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
} as const;

export const APP_CHAINS: Record<
  AppChainId,
  {
    id: AppChainId;
    label: string;
    symbol: string;
    description: string;
    evmChain?: Chain;
  }
> = {
  base: {
    id: "base",
    label: "Base",
    symbol: "ETH",
    description: "Coinbase L2 testnet",
    evmChain: baseSepolia,
  },
  celo: {
    id: "celo",
    label: "Celo",
    symbol: "CELO",
    description: "Mobile-first EVM testnet",
    evmChain: celoSepolia,
  },
  stellar: {
    id: "stellar",
    label: "Stellar",
    symbol: "XLM",
    description: "Fast payments testnet",
  },
};

export const EVM_CHAINS = [baseSepolia, celoSepolia] as const;

export function getEvmChain(chainId: AppChainId): Chain | undefined {
  return APP_CHAINS[chainId].evmChain;
}
