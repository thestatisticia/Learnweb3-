/**
 * Deploy LearnWeb3Badge to Base Sepolia
 * Usage: node scripts/deploy-badge.mjs
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const envPath = resolve(".env.local");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
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

const artifact = JSON.parse(
  readFileSync(resolve("artifacts/LearnWeb3Badge.json"), "utf8"),
);

const baseSepolia = defineChain({
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://sepolia.base.org"] },
  },
  blockExplorers: {
    default: { name: "BaseScan", url: "https://sepolia.basescan.org" },
  },
});

const account = privateKeyToAccount(key);
const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(),
});

const balance = await publicClient.getBalance({ address: account.address });
console.log("Deployer:", account.address);
console.log("Base Sepolia balance:", formatEther(balance), "ETH");

if (balance === 0n) {
  console.error("No Base Sepolia ETH to deploy. Bridge from Sepolia or use the in-app faucet.");
  process.exit(1);
}

console.log("Deploying LearnWeb3Badge...");
const hash = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode,
  args: [],
});

console.log("Deploy tx:", hash);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== "success" || !receipt.contractAddress) {
  console.error("Deploy failed", receipt);
  process.exit(1);
}

const address = receipt.contractAddress;
console.log("Contract:", address);
console.log("Explorer:", `https://sepolia.basescan.org/address/${address}`);

writeFileSync(
  resolve("deployments/base-sepolia-LearnWeb3Badge.json"),
  JSON.stringify(
    {
      network: "base-sepolia",
      chainId: 84532,
      address,
      deployer: account.address,
      txHash: hash,
      deployedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);

const envPath = resolve(".env.local");
let env = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
if (env.includes("NEXT_PUBLIC_BADGE_CONTRACT=")) {
  env = env.replace(
    /NEXT_PUBLIC_BADGE_CONTRACT=.*/g,
    `NEXT_PUBLIC_BADGE_CONTRACT=${address}`,
  );
} else {
  env += `\nNEXT_PUBLIC_BADGE_CONTRACT=${address}\n`;
}
writeFileSync(envPath, env);
console.log("Saved to deployments/ and .env.local");
