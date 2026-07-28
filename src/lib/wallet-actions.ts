import {
  encodeFunctionData,
  formatEther,
  parseEther,
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient,
} from "viem";
import { baseSepolia } from "@/lib/chains";
import { getProgressContractAddress, progressAbi } from "@/lib/progress";
import badgeAbiJson from "@/lib/abi/LearnWeb3Badge.json";
import swapAbiJson from "@/lib/abi/LearnTokenSwap.json";
import {
  MISSION_RECIPIENT,
  SEND_AMOUNT_ETH,
  SWAP_AMOUNT_ETH,
  SWAP_RECEIVE_LEARN,
} from "@/lib/missions";

export type TxPreview = {
  title: string;
  network: string;
  symbol: string;
  balanceBefore: string;
  balanceAfter: string;
  amount: string;
  gasEstimate: string;
  recipient?: string;
  contractAddress?: string;
  actionLabel: string;
};

export type TxReflection = {
  hash: Hash;
  explorerUrl: string;
  network: string;
  gasUsed: string;
  whatHappened: string;
};

const badgeAbi = badgeAbiJson.abi;
const swapAbi = swapAbiJson.abi;

export function getBadgeContractAddress(): Address {
  const address = process.env.NEXT_PUBLIC_BADGE_CONTRACT;
  if (!address) {
    throw new Error("NEXT_PUBLIC_BADGE_CONTRACT is not set");
  }
  return address as Address;
}

export function getSwapContractAddress(): Address {
  const address = process.env.NEXT_PUBLIC_SWAP_CONTRACT;
  if (!address) {
    throw new Error("NEXT_PUBLIC_SWAP_CONTRACT is not set");
  }
  return address as Address;
}

export async function buildSendPreview(
  publicClient: PublicClient,
  address: Address,
): Promise<TxPreview> {
  const balance = await publicClient.getBalance({ address });
  const value = parseEther(SEND_AMOUNT_ETH);
  const gas = await publicClient.estimateGas({
    account: address,
    to: MISSION_RECIPIENT,
    value,
  });
  const gasPrice = await publicClient.getGasPrice();
  const gasCost = gas * gasPrice;
  const balanceAfter = balance - value - gasCost;

  return {
    title: "Send test ETH",
    network: "Base Sepolia",
    symbol: "ETH",
    balanceBefore: formatEther(balance),
    balanceAfter: formatEther(balanceAfter > BigInt(0) ? balanceAfter : BigInt(0)),
    amount: SEND_AMOUNT_ETH,
    gasEstimate: formatEther(gasCost),
    recipient: MISSION_RECIPIENT,
    actionLabel: `Send ${SEND_AMOUNT_ETH} ETH`,
  };
}

export async function buildMintPreview(
  publicClient: PublicClient,
  address: Address,
): Promise<TxPreview> {
  const contract = getBadgeContractAddress();
  const balance = await publicClient.getBalance({ address });
  const data = encodeFunctionData({
    abi: badgeAbi,
    functionName: "mint",
    args: [],
  });
  const gas = await publicClient.estimateGas({
    account: address,
    to: contract,
    data,
  });
  const gasPrice = await publicClient.getGasPrice();
  const gasCost = gas * gasPrice;
  const balanceAfter = balance - gasCost;

  return {
    title: "Mint Explorer Badge",
    network: "Base Sepolia",
    symbol: "ETH",
    balanceBefore: formatEther(balance),
    balanceAfter: formatEther(balanceAfter > BigInt(0) ? balanceAfter : BigInt(0)),
    amount: "0 (free mint)",
    gasEstimate: formatEther(gasCost),
    contractAddress: contract,
    actionLabel: "Mint NFT",
  };
}

export async function buildSwapPreview(
  publicClient: PublicClient,
  address: Address,
): Promise<TxPreview> {
  const contract = getSwapContractAddress();
  const balance = await publicClient.getBalance({ address });
  const value = parseEther(SWAP_AMOUNT_ETH);
  const data = encodeFunctionData({
    abi: swapAbi,
    functionName: "swapExactInput",
    args: [],
  });
  const gas = await publicClient.estimateGas({
    account: address,
    to: contract,
    value,
    data,
  });
  const gasPrice = await publicClient.getGasPrice();
  const gasCost = gas * gasPrice;
  const balanceAfter = balance - value - gasCost;

  return {
    title: "Swap ETH for LEARN",
    network: "Base Sepolia",
    symbol: "ETH",
    balanceBefore: formatEther(balance),
    balanceAfter: formatEther(balanceAfter > BigInt(0) ? balanceAfter : BigInt(0)),
    amount: `${SWAP_AMOUNT_ETH} ETH -> ${SWAP_RECEIVE_LEARN} LEARN`,
    gasEstimate: formatEther(gasCost),
    contractAddress: contract,
    actionLabel: "Swap for LEARN",
  };
}

export async function buildRegisterPreview(
  publicClient: PublicClient,
  address: Address,
  displayName: string,
): Promise<TxPreview> {
  const contract = getProgressContractAddress();
  const balance = await publicClient.getBalance({ address });
  const data = encodeFunctionData({
    abi: progressAbi,
    functionName: "register",
    args: [displayName.trim().slice(0, 32)],
  });
  const gas = await publicClient.estimateGas({
    account: address,
    to: contract,
    data,
  });
  const gasPrice = await publicClient.getGasPrice();
  const gasCost = gas * gasPrice;
  const balanceAfter = balance - gasCost;

  return {
    title: "Register learner name",
    network: "Base Sepolia",
    symbol: "ETH",
    balanceBefore: formatEther(balance),
    balanceAfter: formatEther(balanceAfter > BigInt(0) ? balanceAfter : BigInt(0)),
    amount: displayName.trim().slice(0, 32),
    gasEstimate: formatEther(gasCost),
    contractAddress: contract,
    actionLabel: "Register on-chain",
  };
}

export async function executeSend(
  walletClient: WalletClient,
  publicClient: PublicClient,
  address: Address,
): Promise<TxReflection> {
  const hash = await walletClient.sendTransaction({
    account: address,
    chain: baseSepolia,
    to: MISSION_RECIPIENT,
    value: parseEther(SEND_AMOUNT_ETH),
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error("Transaction failed on-chain");
  }

  return {
    hash,
    explorerUrl: `https://sepolia.basescan.org/tx/${hash}`,
    network: "Base Sepolia",
    gasUsed: formatEther(receipt.gasUsed * receipt.effectiveGasPrice),
    whatHappened:
      "You transferred test ETH to a mission recipient by signing with your wallet. The transaction is permanently recorded on Base Sepolia — this is how value moves on-chain.",
  };
}

export async function executeMint(
  walletClient: WalletClient,
  publicClient: PublicClient,
  address: Address,
): Promise<TxReflection> {
  const contract = getBadgeContractAddress();
  const hash = await walletClient.writeContract({
    account: address,
    chain: baseSepolia,
    address: contract,
    abi: badgeAbi,
    functionName: "mint",
    args: [],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error("Mint transaction failed");
  }

  return {
    hash,
    explorerUrl: `https://sepolia.basescan.org/tx/${hash}`,
    network: "Base Sepolia",
    gasUsed: formatEther(receipt.gasUsed * receipt.effectiveGasPrice),
    whatHappened:
      "You called the mint function on the LearnWeb3 Badge contract. A unique NFT was created and assigned to your wallet — proof that you interacted with a smart contract.",
  };
}

export async function executeSwap(
  walletClient: WalletClient,
  publicClient: PublicClient,
  address: Address,
): Promise<TxReflection> {
  const contract = getSwapContractAddress();
  const hash = await walletClient.writeContract({
    account: address,
    chain: baseSepolia,
    address: contract,
    abi: swapAbi,
    functionName: "swapExactInput",
    args: [],
    value: parseEther(SWAP_AMOUNT_ETH),
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error("Swap transaction failed");
  }

  return {
    hash,
    explorerUrl: `https://sepolia.basescan.org/tx/${hash}`,
    network: "Base Sepolia",
    gasUsed: formatEther(receipt.gasUsed * receipt.effectiveGasPrice),
    whatHappened:
      "You swapped test ETH for LEARN through a smart contract on Base Sepolia. Your wallet signed the transaction, the contract received ETH, and it credited LEARN back to your address.",
  };
}

export async function executeRegister(
  walletClient: WalletClient,
  publicClient: PublicClient,
  address: Address,
  displayName: string,
): Promise<TxReflection> {
  const contract = getProgressContractAddress();
  const hash = await walletClient.writeContract({
    account: address,
    chain: baseSepolia,
    address: contract,
    abi: progressAbi,
    functionName: "register",
    args: [displayName.trim().slice(0, 32)],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error("Registration failed");
  }

  return {
    hash,
    explorerUrl: `https://sepolia.basescan.org/tx/${hash}`,
    network: "Base Sepolia",
    gasUsed: formatEther(receipt.gasUsed * receipt.effectiveGasPrice),
    whatHappened:
      "You registered your learner name on the LearnWeb3 progress contract. Only your wallet could authorize this — that's cryptographic ownership in action.",
  };
}

export async function checkHasMinted(
  publicClient: PublicClient,
  address: Address,
): Promise<boolean> {
  try {
    const contract = getBadgeContractAddress();
    const minted = await publicClient.readContract({
      address: contract,
      abi: badgeAbi,
      functionName: "hasMinted",
      args: [address],
    });
    return Boolean(minted);
  } catch {
    return false;
  }
}

export async function checkHasSwapped(
  publicClient: PublicClient,
  address: Address,
): Promise<boolean> {
  try {
    const contract = getSwapContractAddress();
    const spent = await publicClient.readContract({
      address: contract,
      abi: swapAbi,
      functionName: "spentByUser",
      args: [address],
    });
    return (spent as bigint) > BigInt(0);
  } catch {
    return false;
  }
}
