import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/** Server side Claude client. The key is read only on the server and never sent to the browser. */
export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

let client: Anthropic | null = null;
export function claude(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

/** Shared request options: refusal fallback routing (server side) as recommended for current models. */
export const FALLBACK_OPTIONS = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default" as const,
};

export function textOf(content: Anthropic.Beta.BetaContentBlock[]): string {
  return content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("\n").trim();
}

export const GROUNDING_RULES = `Rules you must follow:
- Use only the figures and records returned by the tools or provided in the message. Never invent revenue figures, deals, customers, people or activities.
- If the data needed to answer is missing, say exactly what is missing and how the user can add it.
- Label every projection, estimate or forecast as a projection and state its assumptions. Never present a forecast as guaranteed.
- Distinguish missing information (a field is empty) from facts about the buyer.
- Cite the specific deals, accounts or numbers you relied on.
- Write in plain business English. Do not use emojis. Do not use dashes as punctuation: use colons, commas or full stops instead.`;

/** Short narrative summary of rule based findings. Returns null when AI is not configured or the call fails. */
export async function summariseFindings(title: string, findings: unknown): Promise<string | null> {
  if (!aiConfigured()) return null;
  try {
    const res = await claude().beta.messages.create({
      model: AI_MODEL,
      max_tokens: 2000,
      ...FALLBACK_OPTIONS,
      output_config: { effort: "low" },
      system: `You are an analyst inside Revenue AI, a revenue intelligence platform. Summarise the findings for a sales leader in at most 5 short sentences, most important first.\n${GROUNDING_RULES}`,
      messages: [{ role: "user", content: `${title}\n\nFindings (JSON, computed from the organisation's records):\n${JSON.stringify(findings).slice(0, 60000)}` }],
    });
    if (res.stop_reason === "refusal") return null;
    return textOf(res.content) || null;
  } catch (err) {
    console.error("[ai] summary failed", err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err);
    return null;
  }
}
