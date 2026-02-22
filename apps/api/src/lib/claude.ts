import Anthropic from "@anthropic-ai/sdk";
import { Response } from "express";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export type MessageParam = { role: "user" | "assistant"; content: string };

/**
 * Stream a Claude response to an SSE-enabled Express Response.
 * Caller must set up SSE headers before calling this.
 */
export async function streamBibleChat(
  messages: MessageParam[],
  res: Response
): Promise<string> {
  const systemPrompt = `You are BibleGPT, a knowledgeable and compassionate AI assistant specializing in the Holy Bible. You help users:
- Understand Bible passages, chapters, and books
- Explore theological concepts and Christian doctrine
- Find relevant scripture for life situations
- Discuss church history and biblical context
- Provide devotional insights and spiritual encouragement

Always respond with warmth, grace, and biblical accuracy. Quote scripture when helpful (KJV preferred). If asked about a specific verse, provide it from the KJV. Be encouraging and faith-affirming.`;

  let fullResponse = "";

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      const text = chunk.delta.text;
      fullResponse += text;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  return fullResponse;
}
