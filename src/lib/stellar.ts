import { Horizon } from "@stellar/stellar-sdk";
import { STELLAR_TESTNET } from "@/lib/chains";

export async function fundStellarTestnetWallet(address: string) {
  const response = await fetch(
    `${STELLAR_TESTNET.friendbotUrl}?addr=${encodeURIComponent(address)}`,
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Stellar Friendbot funding failed");
  }

  return response.json();
}

export async function getStellarBalance(address: string) {
  const server = new Horizon.Server(STELLAR_TESTNET.horizonUrl);

  try {
    const account = await server.loadAccount(address);
    const native = account.balances.find((balance) => balance.asset_type === "native");
    return native?.balance ?? "0";
  } catch {
    return null;
  }
}
