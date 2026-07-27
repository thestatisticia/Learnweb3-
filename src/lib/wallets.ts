import type { User } from "@privy-io/react-auth";

type LinkedWallet = Extract<
  User["linkedAccounts"][number],
  { type: "wallet" }
>;

export function getEmbeddedEvmWallet(user: User | null | undefined) {
  if (!user) return undefined;

  return user.linkedAccounts.find(
    (account): account is LinkedWallet =>
      account.type === "wallet" &&
      account.walletClientType === "privy" &&
      account.chainType === "ethereum",
  );
}

export function getStellarWallet(user: User | null | undefined) {
  if (!user) return undefined;

  return user.linkedAccounts.find(
    (account): account is LinkedWallet =>
      account.type === "wallet" &&
      account.walletClientType === "privy" &&
      account.chainType === "stellar",
  );
}

export function shortenAddress(address: string, chars = 4) {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars + (address.startsWith("0x") ? 2 : 0))}...${address.slice(-chars)}`;
}
