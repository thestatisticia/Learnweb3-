/**
 * Bridge ETH from Ethereum Sepolia → Base Sepolia via OptimismPortal.
 * Usage: node scripts/bridge-sepolia-to-base.mjs [amountEth]
 */
import { createPublicClient, createWalletClient, formatEther, http, parseEther, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const key = process.env.FAUCET_PRIVATE_KEY;
if (!key) {
  console.error("Missing FAUCET_PRIVATE_KEY");
  process.exit(1);
}

const account = privateKeyToAccount(key);

// Base Sepolia L1 OptimismPortal on Ethereum Sepolia
const OPTIMISM_PORTAL = "0x49f53e41452C74589E85cA1677426Ba426459e85";

const ethSepolia = defineChain({
  id: 11155111,
  name: "Ethereum Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://ethereum-sepolia-rpc.publicnode.com"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
});

const baseSepolia = defineChain({
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://sepolia.base.org"] } },
});

const amountArg = process.argv[2] ?? "0.08";
const amount = parseEther(amountArg);

const l1Public = createPublicClient({ chain: ethSepolia, transport: http() });
const l2Public = createPublicClient({ chain: baseSepolia, transport: http() });
const wallet = createWalletClient({
  account,
  chain: ethSepolia,
  transport: http(),
});

const beforeL1 = await l1Public.getBalance({ address: account.address });
const beforeL2 = await l2Public.getBalance({ address: account.address });

console.log("Faucet:", account.address);
console.log("Sepolia before:     ", formatEther(beforeL1), "ETH");
console.log("Base Sepolia before:", formatEther(beforeL2), "ETH");
console.log("Bridging:           ", amountArg, "ETH → Base Sepolia");
console.log("");

if (beforeL1 < amount + parseEther("0.005")) {
  console.error("Not enough Sepolia ETH (need amount + ~0.005 for gas)");
  process.exit(1);
}

// Sending ETH to OptimismPortal deposits to the same address on Base Sepolia
const hash = await wallet.sendTransaction({
  to: OPTIMISM_PORTAL,
  value: amount,
});

console.log("L1 tx submitted:", hash);
console.log("Explorer:", `https://sepolia.etherscan.io/tx/${hash}`);
console.log("Waiting for confirmation...");

const receipt = await l1Public.waitForTransactionReceipt({ hash });
console.log("Confirmed in block", receipt.blockNumber.toString(), "status:", receipt.status);
console.log("");
console.log("Base Sepolia credit usually arrives in 1–3 minutes.");
console.log("Run: npm run faucet:status");
console.log("Or check: https://sepolia.basescan.org/address/" + account.address);
