export type ChatIntent =
  | "FUND"
  | "BALANCE"
  | "LEARN"
  | "QUIZ"
  | "SEND"
  | "SWAP"
  | "MINT"
  | "MISSION"
  | "SWITCH_CHAIN"
  | "GREETING"
  | "EXPLAIN";

export function detectIntent(message: string): ChatIntent {
  const text = message.toLowerCase().trim();

  if (/^(hi|hello|hey|start|help)\b/.test(text)) return "GREETING";
  if (/start mission|next mission|continue mission|my mission/.test(text))
    return "MISSION";
  if (/swap|swapping|trade|exchange tokens|token swap/.test(text)) return "SWAP";
  if (/mint|nft|badge|explorer badge/.test(text)) return "MINT";
  if (/send|transfer|pay|send eth|send test/.test(text)) return "SEND";
  if (/fund|faucet|get test|receive test|send me test|top up|get tokens/.test(text))
    return "FUND";
  if (/balance|how much do i have|check my wallet|what do i have/.test(text))
    return "BALANCE";
  if (/quiz me|take a quiz|start quiz|test me/.test(text)) return "QUIZ";
  if (/switch to|use (base|celo|stellar)|change chain/.test(text))
    return "SWITCH_CHAIN";
  if (/learn|lesson|lecture|teach me|course|tutorial|wallet basics/.test(text))
    return "LEARN";

  return "EXPLAIN";
}

export function detectChainFromMessage(
  message: string,
): "base" | "celo" | "stellar" | null {
  const text = message.toLowerCase();
  if (/\bstellar\b|\bxlm\b/.test(text)) return "stellar";
  if (/\bcelo\b/.test(text)) return "celo";
  if (/\bbase\b|\beth\b/.test(text)) return "base";
  return null;
}

export function detectQuizLectureId(message: string): string | null {
  const text = message.toLowerCase();
  if (/wallet/.test(text)) return "wallets";
  if (/transaction|gas|fee/.test(text)) return "transactions";
  if (/chain|base|celo|stellar|network/.test(text)) return "chains";
  if (/security|phish|scam/.test(text)) return "security";
  return "wallets";
}
