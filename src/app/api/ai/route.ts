import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { response: "AI features require an API key. Please add ANTHROPIC_API_KEY or OPENAI_API_KEY to your environment variables in the SearchSprout settings." },
        { status: 200 }
      );
    }

    const systemPrompt = `You are the SearchSprout AI assistant. You help users understand their search performance, analytics and content strategy.

Your role:
- Analyse search query patterns and trends
- Identify content gaps from zero-result queries
- Suggest ways to improve search relevance and click-through rates
- Recommend content improvements based on search data
- Provide actionable insights grounded in the user's search analytics

Always be concise, specific and actionable. Format responses with clear structure when appropriate. Do not invent data: acknowledge when you do not have access to real analytics and explain what insights you could provide with that data.`;

    // Try Anthropic first
    if (process.env.ANTHROPIC_API_KEY) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.slice(-10).map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ response: data.content?.[0]?.text || "No response generated." });
      }
    }

    // Fallback: OpenAI
    if (process.env.OPENAI_API_KEY) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(-10),
          ],
          max_tokens: 1024,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ response: data.choices?.[0]?.message?.content || "No response generated." });
      }
    }

    return NextResponse.json({ response: "Unable to connect to AI service. Please check your API key configuration." });
  } catch {
    return NextResponse.json({ response: "An error occurred while processing your request." }, { status: 500 });
  }
}
