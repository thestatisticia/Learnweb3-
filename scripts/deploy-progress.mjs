/**
 * Deploy LearnWeb3Progress to Ethereum Sepolia
 * Usage: node scripts/deploy-progress.mjs
 */
import { createPublicClient, createWalletClient, http, defineChain, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const raw = readFileSync(resolve(".env.local"), "utf8");
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
  readFileSync(resolve("artifacts/LearnWeb3Progress.json"), "utf8"),
);

const sepolia = defineChain({
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

const account = privateKeyToAccount(key);
const publicClient = createPublicClient({ chain: sepolia, transport: http() });
const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(),
});

const balance = await publicClient.getBalance({ address: account.address });
console.log("Deployer:", account.address);
console.log("Sepolia balance:", formatEther(balance), "ETH");

if (balance === 0n) {
  console.error("No Sepolia ETH to deploy");
  process.exit(1);
}

console.log("Deploying LearnWeb3Progress...");
const hash = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode,
  args: [],
});

console.log("Deploy tx:", hash);
console.log("Explorer:", `https://sepolia.etherscan.io/tx/${hash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== "success" || !receipt.contractAddress) {
  console.error("Deploy failed", receipt);
  process.exit(1);
}

const address = receipt.contractAddress;
console.log("Contract:", address);
console.log("Explorer:", `https://sepolia.etherscan.io/address/${address}`);

const deployment = {
  network: "ethereum-sepolia",
  chainId: 11155111,
  address,
  deployer: account.address,
  txHash: hash,
  deployedAt: new Date().toISOString(),
};

writeFileSync(
  resolve("deployments/sepolia-LearnWeb3Progress.json"),
  JSON.stringify(deployment, null, 2),
);

// Update .env.local
const envPath = resolve(".env.local");
let env = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
if (env.includes("NEXT_PUBLIC_PROGRESS_CONTRACT=")) {
  env = env.replace(
    /NEXT_PUBLIC_PROGRESS_CONTRACT=.*/g,
    `NEXT_PUBLIC_PROGRESS_CONTRACT=${address}`,
  );
} else {
  env += `\n# LearnWeb3Progress on Ethereum Sepolia\nNEXT_PUBLIC_PROGRESS_CONTRACT=${address}\n`;
}
if (!env.includes("NEXT_PUBLIC_PROGRESS_CHAIN_ID=")) {
  env += `NEXT_PUBLIC_PROGRESS_CHAIN_ID=11155111\n`;
} else {
  env = env.replace(
    /NEXT_PUBLIC_PROGRESS_CHAIN_ID=.*/g,
    `NEXT_PUBLIC_PROGRESS_CHAIN_ID=11155111`,
  );
}
writeFileSync(envPath, env);

console.log("Saved to deployments/ and .env.local");
