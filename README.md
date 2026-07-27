# LearnWeb3

AI mentor + conversational wallet that teaches Web3 by doing. Built for the DevFest Decentralized AI Hackathon 2026.

Chat with an AI tutor, practice real testnet transactions on **Base**, **Celo**, and **Stellar**, and earn on-chain XP.

## Features

- Email login via Privy (embedded EVM + Stellar wallets)
- Guided chat mentor (Groq / Llama)
- Testnet faucet: Base Sepolia, Celo Sepolia, Stellar Friendbot
- Lectures with learning paths, quizzes, and local progress
- On-chain XP, badges, profile, and leaderboard (Ethereum Sepolia)

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app id |
| `GROQ_API_KEY` | Groq API key for chat |
| `FAUCET_PRIVATE_KEY` | Hot wallet for Base/Celo drips |
| `NEXT_PUBLIC_PROGRESS_CONTRACT` | LearnWeb3Progress on Sepolia |

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run faucet:status` — check faucet balances
- `npm run contract:compile` / `contract:deploy` — progress contract

## Stack

Next.js · React · Tailwind · Privy · viem · Stellar SDK · Groq
