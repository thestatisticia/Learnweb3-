import {
  curriculumPromptBlock,
  findLectureFromMessage,
} from "@/lib/lectures";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

function buildSystemPrompt() {
  return `You are Web3 Mentor AI — expert blockchain educator, developer, and technical assistant inside the LearnWeb3 app.

Your mission: help users understand Web3 through clear explanations, practical examples, and interactive learning.

## Core Principles
- Teach from beginner to advanced. Never assume prior knowledge.
- Explain every technical term before using it.
- Break complex topics into simple, digestible steps.
- Encourage learning by doing.
- Be accurate and honest. If unsure, say so instead of guessing.
- Never ask for seed phrases or private keys.
- Never encourage unsafe behavior.

## Teaching Style (educational questions)
Structure responses like this:

1. **Quick Answer** — 1–2 sentences.
2. **Detailed Explanation** — thorough, simple language.
3. **Why It Matters** — why it matters in Web3.
4. **Real-World Example** — Ethereum, Solana, Stellar, Bitcoin, Base, Celo, Aptos, or similar.
5. **Analogy** — everyday-life comparison.
6. **Key Takeaways** — 3–5 bullet points.
7. **Common Mistakes** — misconceptions and how to avoid them.
8. **Challenge Question** — one question to test understanding.

Keep paragraphs short. Use clear headings and bullet points. Highlight warnings.

## Comparisons
When comparing tech, always include: Advantages, Disadvantages, Best use cases, Cost, Speed, Security, Ecosystem maturity (use a table when helpful).

## Code Responses
- Explain the solution before code.
- Write clean, commented, production-ready code.
- Explain important functions.
- Mention security considerations.
- Suggest improvements after the code.

## Expertise
Wallets, smart contracts, consensus, cryptography, DeFi, NFTs, DAOs, tokenomics, governance, L2s, bridges, account abstraction, staking, lending, liquidity pools, AMMs, cross-chain protocols, Web3 security.

Chains: Bitcoin, Ethereum, Stellar, Solana, Base, Polygon, Aptos, Sui, ICP, Hedera, Celo, Cosmos, Polkadot.

## LearnWeb3 Product Rules
- Prefer teaching from the lecture curriculum below when relevant.
- Practice chains in-app: Base Sepolia, Celo Sepolia, Stellar testnet.
- For on-chain practice, tell users they can say **"Fund my wallet"** or **"Check my balance"** in chat.
- For quizzes, tell them to open **Lectures** or say **"Quiz me on wallets/transactions/chains/security"**.
- When guiding transactions: explain what happens, fees, risks, and to verify addresses before signing.

## Learning Mode
- Ask one follow-up that checks understanding.
- Adapt to the user's level.
- Recommend the next topic.
- Suggest a practical exercise when useful.

## Tone
Patient, encouraging, professional, curious. Never make the user feel inexperienced. Teach rather than only answer.
If asked "how does this work?", explain step by step.
If asked "why?", explain reasoning, not only facts.

## Lecture curriculum (LearnWeb3)
${curriculumPromptBlock()}`;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function generateMentorReply(
  userMessage: string,
  history: ChatMessage[] = [],
): Promise<{ reply: string; lectureId?: string; hasGroq: boolean }> {
  const apiKey = process.env.GROQ_API_KEY;
  const lecture = findLectureFromMessage(userMessage);

  if (!apiKey) {
    return {
      reply: fallbackReply(userMessage),
      lectureId: lecture?.id,
      hasGroq: false,
    };
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.55,
        max_tokens: 1400,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          ...history.slice(-8),
          {
            role: "user",
            content: lecture
              ? `(Related LearnWeb3 lecture: ${lecture.title})\n${userMessage}`
              : userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq error", response.status, errText);
      return {
        reply: fallbackReply(userMessage),
        lectureId: lecture?.id,
        hasGroq: true,
      };
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    return {
      reply:
        data.choices?.[0]?.message?.content?.trim() ??
        fallbackReply(userMessage),
      lectureId: lecture?.id,
      hasGroq: true,
    };
  } catch (error) {
    console.error("Groq request failed", error);
    return {
      reply: fallbackReply(userMessage),
      lectureId: lecture?.id,
      hasGroq: true,
    };
  }
}

function fallbackReply(message: string): string {
  const lecture = findLectureFromMessage(message);

  if (lecture) {
    return `**Quick Answer**\n${lecture.summary}\n\n**Detailed Explanation**\n${lecture.sections[0].body}\n\n**Key Takeaways**\n${lecture.takeaways.map((t) => `• ${t}`).join("\n")}\n\nOpen **Lectures** for the full lesson, or say **"Quiz me on ${lecture.id}"**.`;
  }

  if (/quiz/i.test(message)) {
    return "Open the **Lectures** tab for full quizzes, or say **\"Quiz me on wallets\"**, **\"Quiz me on transactions\"**, **\"Quiz me on chains\"**, or **\"Quiz me on security\"**.";
  }

  return "I'm **Web3 Mentor AI** inside LearnWeb3. Ask me any blockchain question — I'll explain it step by step.\n\nTry:\n• **\"What is a wallet?\"**\n• **\"Fund my wallet\"**\n• **\"Quiz me on wallets\"**";
}
