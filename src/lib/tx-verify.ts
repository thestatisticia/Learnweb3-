import {
  createPublicClient,
  http,
  parseEther,
  type Address,
  type Hash,
} from "viem";
import { baseSepolia } from "@/lib/chains";
import { getBadgeContractAddress } from "@/lib/wallet-actions";
import badgeAbiJson from "@/lib/abi/LearnWeb3Badge.json";
import { MISSION_RECIPIENT, SEND_AMOUNT_ETH } from "@/lib/missions";

const badgeAbi = badgeAbiJson.abi;
const MIN_SEND = parseEther(SEND_AMOUNT_ETH) / BigInt(2);

export async function verifySendTransaction(
  txHash: Hash,
  expectedFrom: Address,
): Promise<{ valid: boolean; error?: string }> {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const receipt = await client.getTransactionReceipt({ hash: txHash });
  if (receipt.status !== "success") {
    return { valid: false, error: "Transaction did not succeed" };
  }

  const tx = await client.getTransaction({ hash: txHash });
  if (tx.from.toLowerCase() !== expectedFrom.toLowerCase()) {
    return { valid: false, error: "Transaction sender mismatch" };
  }
  if (tx.to?.toLowerCase() !== MISSION_RECIPIENT.toLowerCase()) {
    return { valid: false, error: "Invalid recipient" };
  }
  if (!tx.value || tx.value < MIN_SEND) {
    return { valid: false, error: "Send amount too low" };
  }

  return { valid: true };
}

export async function verifyMintTransaction(
  txHash: Hash,
  expectedFrom: Address,
): Promise<{ valid: boolean; error?: string }> {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const receipt = await client.getTransactionReceipt({ hash: txHash });
  if (receipt.status !== "success") {
    return { valid: false, error: "Mint transaction failed" };
  }

  const tx = await client.getTransaction({ hash: txHash });
  if (tx.from.toLowerCase() !== expectedFrom.toLowerCase()) {
    return { valid: false, error: "Transaction sender mismatch" };
  }

  const contract = getBadgeContractAddress();
  if (tx.to?.toLowerCase() !== contract.toLowerCase()) {
    return { valid: false, error: "Invalid mint contract" };
  }

  const minted = await client.readContract({
    address: contract,
    abi: badgeAbi,
    functionName: "hasMinted",
    args: [expectedFrom],
  });

  if (!minted) {
    return { valid: false, error: "NFT not minted for this wallet" };
  }

  return { valid: true };
}
