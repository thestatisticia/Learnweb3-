import { NextResponse } from "next/server";
import { generateMentorReply } from "@/lib/llm";

type ChatRequest = {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const { message, history = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const result = await generateMentorReply(message.trim(), history);

    return NextResponse.json(result);
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Chat request failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
