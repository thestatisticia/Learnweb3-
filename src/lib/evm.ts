import { createPublicClient, formatEther, http } from "viem";
import { getEvmChain, type AppChainId } from "@/lib/chains";

export async function getEvmBalance(chainId: AppChainId, address: `0x${string}`) {
  const chain = getEvmChain(chainId);
  if (!chain) return null;

  const client = createPublicClient({
    chain,
    transport: http(),
  });

  const balance = await client.getBalance({ address });
  return formatEther(balance);
}
