export type WalletActionKind = "send" | "mint" | "register" | "swap";

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
  hash: string;
  explorerUrl: string;
  network: string;
  gasUsed: string;
  whatHappened: string;
};

export type MessageAction = {
  type: "fund" | "balance" | "quiz" | "wallet";
  chain?: import("@/lib/chains").AppChainId;
  walletAction?: WalletActionKind;
  phase?: "simulate" | "confirm";
  preview?: TxPreview;
  reflection?: TxReflection;
  registerName?: string;
  status: "ready" | "loading" | "success" | "error";
  result?: string;
  quizOptions?: string[];
  quizQuestionIndex?: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: MessageAction;
};
