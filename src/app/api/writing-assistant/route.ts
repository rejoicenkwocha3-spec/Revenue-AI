import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, task, context } = await req.json();
  if (!text || !task) return NextResponse.json({ error: "text and task required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ response: "AI writing assistance requires an Anthropic API key. Add ANTHROPIC_API_KEY to your environment variables." });
  }

  const systemPrompts: Record<string, string> = {
    improve: `You are an academic writing assistant. The user will provide text from their academic document. Your role is to suggest improvements for clarity, academic tone and coherence.

RULES:
- Do not rewrite their entire text wholesale.
- Provide specific, targeted suggestions with examples.
- Preserve the writer's original voice and meaning.
- Do not add fabricated citations, references or facts.
- Focus on structure, clarity and academic register.
- Keep suggestions constructive and educational.`,
    grammar: `You are an academic grammar and style reviewer. Identify grammar, punctuation and style issues in the provided text.

RULES:
- List specific issues with line-level context.
- Explain WHY each is an issue.
- Suggest a corrected version for each.
- Do not rewrite the entire document.
- Be concise and actionable.`,
    citations: `You are an academic citation specialist. Review the provided text for citation and referencing issues.

RULES:
- Identify in-text citations that appear incomplete or incorrectly formatted.
- Identify passages that appear to need a citation but have none.
- Do not invent or fabricate citations or sources.
- Do not claim to verify whether a cited source actually exists or is accurate.
- Suggest formatting corrections based on the apparent citation style in use.`,
    structure: `You are an academic writing structure advisor. Analyse the structure and organisation of the provided text.

RULES:
- Comment on logical flow, paragraph organisation and argument coherence.
- Suggest structural improvements without rewriting the content.
- Identify missing transitions, unsupported claims and logical gaps.
- Do not add fabricated content or examples.`,
    tone: `You are an academic tone and register advisor. Evaluate whether the writing achieves an appropriate academic tone.

RULES:
- Identify informal language, slang or colloquialisms.
- Suggest more academically appropriate alternatives.
- Comment on hedging language, objectivity and evidence-based claims.
- Do not rewrite large portions of the text.`,
  };

  const systemPrompt = systemPrompts[task] ?? systemPrompts.improve;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1200,
        system: systemPrompt,
        messages: [
          ...(context ? [{ role: "user" as const, content: context }, { role: "assistant" as const, content: "I understand. Please share the text you would like me to review." }] : []),
          { role: "user" as const, content: text.slice(0, 3000) },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: { message?: string } }).error?.message ?? `API error ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({ response: data.content?.[0]?.text ?? "No response generated." });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "AI service error" }, { status: 500 });
  }
}
