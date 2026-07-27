export type QuizQuestion = {
  id: string;
  prompt: string;
  options: [string, string, string];
  /** 0 | 1 | 2 */
  correctIndex: number;
  explanation: string;
};

export type LectureLevel = "Beginner" | "Intermediate" | "Advanced";
export type LearningPathId = "foundations" | "intermediate" | "advanced";

export type Lecture = {
  id: string;
  title: string;
  summary: string;
  duration: string;
  level: LectureLevel;
  pathId: LearningPathId;
  order: number;
  xpReward: number;
  badgeHint?: string;
  sections: { heading: string; body: string }[];
  takeaways: string[];
  chatHints: string[];
  quiz: QuizQuestion[];
  /** Maps to on-chain progress action when quiz passed */
  awardsQuizXp: boolean;
};

/** Upcoming / locked catalog entries (no full content yet) */
export type UpcomingLesson = {
  id: string;
  title: string;
  pathId: LearningPathId;
  level: LectureLevel;
  duration: string;
  xpReward: number;
  lockedReason: string;
};

export const LEARNING_PATHS: {
  id: LearningPathId;
  title: string;
  description: string;
}[] = [
  {
    id: "foundations",
    title: "Web3 Foundations",
    description: "Wallets, transactions, chains, and security basics",
  },
  {
    id: "intermediate",
    title: "Intermediate",
    description: "Contracts, NFTs, DAOs, and wallet connections",
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "Cross-chain, DeFi security, L2s, and AI agents",
  },
];

export const LECTURES: Lecture[] = [
  {
    id: "wallets",
    title: "What is a Crypto Wallet?",
    summary:
      "Understand wallets, addresses, and why you never share a seed phrase.",
    duration: "6 min",
    level: "Beginner",
    pathId: "foundations",
    order: 1,
    xpReward: 25,
    badgeHint: "Wallet Beginner",
    sections: [
      {
        heading: "Think of it like an account",
        body: "A crypto wallet is your identity on a blockchain. It has a public address (like an account number) that others use to send you tokens, and a private key that proves you control that address.",
      },
      {
        heading: "Public vs private",
        body: "Your public address is safe to share. Your private key or seed phrase is not. Anyone with the seed phrase can move your funds. LearnWeb3 creates an embedded wallet for you when you sign in, so you can practice without handling a seed phrase on day one.",
      },
      {
        heading: "Testnets vs mainnet",
        body: "Testnets use fake tokens so you can learn safely. Mainnets use real money. Always practice on testnet first — Base Sepolia, Celo Sepolia, or Stellar testnet.",
      },
    ],
    takeaways: [
      "A wallet = your on-chain identity",
      "Share addresses, never seed phrases",
      "Practice on testnets before mainnet",
    ],
    chatHints: [
      "What is a wallet?",
      "Explain public vs private keys",
      "Quiz me on wallets",
    ],
    awardsQuizXp: true,
    quiz: [
      {
        id: "w1",
        prompt: "What should you NEVER share?",
        options: [
          "Your public wallet address",
          "Your seed phrase / private key",
          "Your username",
        ],
        correctIndex: 1,
        explanation:
          "Seed phrases and private keys control your funds. Addresses are meant to be shared.",
      },
      {
        id: "w2",
        prompt: "What is a public address used for?",
        options: [
          "Signing into Google",
          "Receiving tokens from others",
          "Paying electricity bills",
        ],
        correctIndex: 1,
        explanation:
          "Others send tokens to your public address, like depositing to an account number.",
      },
      {
        id: "w3",
        prompt: "Why use a testnet when learning?",
        options: [
          "It has better graphics",
          "You practice with free fake tokens",
          "It replaces the need for a wallet",
        ],
        correctIndex: 1,
        explanation:
          "Testnets let you practice real blockchain actions without risking real money.",
      },
    ],
  },
  {
    id: "transactions",
    title: "Transactions & Gas Fees",
    summary: "Learn what a transaction is and why networks charge small fees.",
    duration: "7 min",
    level: "Beginner",
    pathId: "foundations",
    order: 2,
    xpReward: 25,
    sections: [
      {
        heading: "What is a transaction?",
        body: "A transaction is an instruction you send to the blockchain — for example, “send 0.01 ETH to this address.” Once confirmed, it becomes part of the permanent public record.",
      },
      {
        heading: "Gas fees explained",
        body: "Gas is the fee paid to process your transaction. Think of it like postage. Busier networks cost more. On LearnWeb3 testnets, fees are paid with free test tokens from the faucet.",
      },
      {
        heading: "Confirm before you send",
        body: "Always preview: who you’re sending to, how much, and the fee. In chat, LearnWeb3 shows a confirm step before funding or sending so you stay in control.",
      },
    ],
    takeaways: [
      "Transactions update the blockchain ledger",
      "Gas = network processing fee",
      "Always confirm amount and recipient",
    ],
    chatHints: [
      "What are gas fees?",
      "How do transactions work?",
      "Quiz me on transactions",
    ],
    awardsQuizXp: true,
    quiz: [
      {
        id: "t1",
        prompt: "Gas fees are best compared to:",
        options: ["A password", "Postage for your transaction", "A stock price"],
        correctIndex: 1,
        explanation: "Gas pays the network to process your transaction.",
      },
      {
        id: "t2",
        prompt: "Before sending tokens you should:",
        options: [
          "Share your seed phrase",
          "Double-check amount and address",
          "Disable your wallet",
        ],
        correctIndex: 1,
        explanation: "Confirming details prevents costly mistakes.",
      },
      {
        id: "t3",
        prompt: "On LearnWeb3 testnets, gas is paid with:",
        options: [
          "Real bank money only",
          "Free test tokens",
          "Social media likes",
        ],
        correctIndex: 1,
        explanation: "Faucets give free test tokens for learning.",
      },
    ],
  },
  {
    id: "chains",
    title: "Base, Celo & Stellar",
    summary: "Compare the three networks you practice on inside LearnWeb3.",
    duration: "8 min",
    level: "Beginner",
    pathId: "foundations",
    order: 3,
    xpReward: 25,
    sections: [
      {
        heading: "Base",
        body: "Base is an Ethereum Layer 2 built by Coinbase. It feels familiar if you know Ethereum apps, with lower fees than Ethereum mainnet. LearnWeb3 uses Base Sepolia for practice ETH.",
      },
      {
        heading: "Celo",
        body: "Celo is designed for mobile-friendly payments and real-world use. On LearnWeb3 you practice with Celo Sepolia test tokens.",
      },
      {
        heading: "Stellar",
        body: "Stellar focuses on fast, low-cost payments. Testnet funding is instant via Friendbot — great for beginners seeing their first balance appear quickly.",
      },
    ],
    takeaways: [
      "Base ≈ Ethereum L2 for apps",
      "Celo ≈ mobile payments focus",
      "Stellar ≈ fast cheap transfers",
    ],
    chatHints: [
      "Compare Base and Stellar",
      "Which chain should I start with?",
      "Quiz me on chains",
    ],
    awardsQuizXp: true,
    quiz: [
      {
        id: "c1",
        prompt: "Base is best described as:",
        options: [
          "A mobile phone brand",
          "An Ethereum Layer 2 network",
          "A type of NFT art",
        ],
        correctIndex: 1,
        explanation: "Base is Coinbase’s Ethereum L2.",
      },
      {
        id: "c2",
        prompt: "Which network is known for fast payment-focused transfers?",
        options: ["Stellar", "Excel", "Wi‑Fi"],
        correctIndex: 0,
        explanation: "Stellar is built for fast, low-cost payments.",
      },
      {
        id: "c3",
        prompt: "Friendbot helps you on:",
        options: [
          "Stellar testnet",
          "Bank wire transfers",
          "Instagram DMs",
        ],
        correctIndex: 0,
        explanation: "Friendbot auto-funds Stellar testnet accounts.",
      },
    ],
  },
  {
    id: "security",
    title: "Web3 Security Basics",
    summary: "Avoid scams, phishing, and common beginner mistakes.",
    duration: "6 min",
    level: "Beginner",
    pathId: "foundations",
    order: 4,
    xpReward: 25,
    badgeHint: "Security Guardian",
    sections: [
      {
        heading: "Phishing is common",
        body: "Scammers send fake links that look like real wallets or exchanges. Always check the URL. LearnWeb3 will never ask for your seed phrase.",
      },
      {
        heading: "Approvals matter",
        body: "Some apps ask permission to move tokens. Unlimited approvals are risky. On testnet you’re safer, but build the habit of reading what you approve.",
      },
      {
        heading: "Good habits",
        body: "Use unique passwords for email login, bookmark official sites, and start with small test amounts. If something feels rushed or scary, stop.",
      },
    ],
    takeaways: [
      "Never enter a seed phrase into random sites",
      "Verify links before connecting",
      "Read approvals carefully",
    ],
    chatHints: [
      "How do phishing scams work?",
      "What is a token approval?",
      "Quiz me on security",
    ],
    awardsQuizXp: true,
    quiz: [
      {
        id: "s1",
        prompt: "LearnWeb3 will never ask for your:",
        options: ["Email", "Seed phrase", "Preferred chain"],
        correctIndex: 1,
        explanation: "Legitimate apps don’t ask you to paste seed phrases.",
      },
      {
        id: "s2",
        prompt: "A suspicious urgent message with a wallet link is often:",
        options: ["A phishing attempt", "Required homework", "Gas fee"],
        correctIndex: 0,
        explanation: "Urgency + unexpected links are classic phishing tactics.",
      },
      {
        id: "s3",
        prompt: "Before approving a dApp, you should:",
        options: [
          "Approve everything instantly",
          "Read what permission you’re giving",
          "Share your private key",
        ],
        correctIndex: 1,
        explanation: "Understanding approvals protects your funds.",
      },
    ],
  },
];

export const UPCOMING_LESSONS: UpcomingLesson[] = [
  {
    id: "tokens",
    title: "Tokens & Fungibility",
    pathId: "foundations",
    level: "Beginner",
    duration: "7 min",
    xpReward: 25,
    lockedReason: "Coming soon",
  },
  {
    id: "defi-intro",
    title: "Intro to DeFi",
    pathId: "foundations",
    level: "Beginner",
    duration: "8 min",
    xpReward: 30,
    lockedReason: "Coming soon",
  },
  {
    id: "smart-contracts",
    title: "Smart Contracts",
    pathId: "intermediate",
    level: "Intermediate",
    duration: "10 min",
    xpReward: 40,
    lockedReason: "Complete Foundations first",
  },
  {
    id: "nfts",
    title: "NFTs",
    pathId: "intermediate",
    level: "Intermediate",
    duration: "8 min",
    xpReward: 40,
    lockedReason: "Complete Foundations first",
  },
  {
    id: "daos",
    title: "DAOs",
    pathId: "intermediate",
    level: "Intermediate",
    duration: "8 min",
    xpReward: 40,
    lockedReason: "Coming soon",
  },
  {
    id: "walletconnect",
    title: "WalletConnect",
    pathId: "intermediate",
    level: "Intermediate",
    duration: "7 min",
    xpReward: 35,
    lockedReason: "Coming soon",
  },
  {
    id: "cross-chain",
    title: "Cross-chain",
    pathId: "advanced",
    level: "Advanced",
    duration: "12 min",
    xpReward: 50,
    lockedReason: "Complete Intermediate first",
  },
  {
    id: "defi-security",
    title: "DeFi Security",
    pathId: "advanced",
    level: "Advanced",
    duration: "12 min",
    xpReward: 50,
    lockedReason: "Coming soon",
  },
  {
    id: "layer2s",
    title: "Layer 2s",
    pathId: "advanced",
    level: "Advanced",
    duration: "10 min",
    xpReward: 45,
    lockedReason: "Coming soon",
  },
  {
    id: "ai-agents",
    title: "AI Agents",
    pathId: "advanced",
    level: "Advanced",
    duration: "10 min",
    xpReward: 50,
    lockedReason: "Coming soon",
  },
];

export function getLecture(id: string) {
  return LECTURES.find((l) => l.id === id);
}

export function lecturesByPath(pathId: LearningPathId) {
  return LECTURES.filter((l) => l.pathId === pathId).sort(
    (a, b) => a.order - b.order,
  );
}

export function upcomingByPath(pathId: LearningPathId) {
  return UPCOMING_LESSONS.filter((l) => l.pathId === pathId);
}

export function findLectureFromMessage(message: string): Lecture | null {
  const text = message.toLowerCase();
  if (/wallet|seed|private key|address/.test(text)) return getLecture("wallets")!;
  if (/gas|fee|transaction|send token/.test(text))
    return getLecture("transactions")!;
  if (/base|celo|stellar|chain|network/.test(text)) return getLecture("chains")!;
  if (/security|phish|scam|approval/.test(text)) return getLecture("security")!;
  return null;
}

export function curriculumPromptBlock() {
  return LECTURES.map(
    (l) =>
      `### ${l.title} (id: ${l.id})\n${l.sections.map((s) => `${s.heading}: ${s.body}`).join("\n")}\nTakeaways: ${l.takeaways.join("; ")}`,
  ).join("\n\n");
}

export const PASS_SCORE = 2; // need at least 2/3 correct
