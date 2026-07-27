/**
 * Check faucet wallet balances on Base Sepolia + Celo Sepolia.
 * Usage: node scripts/faucet-status.mjs
 */
import { createPublicClient, formatEther, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
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
  } catch {
    // ignore
  }
}

loadEnvLocal();

const key = process.env.FAUCET_PRIVATE_KEY;
if (!key) {
  console.error("Missing FAUCET_PRIVATE_KEY in .env.local");
  process.exit(1);
}

const account = privateKeyToAccount(key);
const baseSepolia = defineChain({
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://sepolia.base.org"] } },
});
const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] },
  },
});

async function balance(chain) {
  const client = createPublicClient({ chain, transport: http() });
  const wei = await client.getBalance({ address: account.address });
  return formatEther(wei);
}

console.log("Faucet address:", account.address);
console.log("");

const [baseBal, celoBal] = await Promise.all([
  balance(baseSepolia),
  balance(celoSepolia),
]);

console.log(`Base Sepolia ETH:  ${baseBal}`);
console.log(`Celo Sepolia CELO: ${celoBal}`);
console.log("");
console.log("Fund this address, then restart npm run dev if needed.");
console.log("Base faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
console.log("Celo faucet: https://faucet.celo.org");
