import { z } from "zod";
import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadOrgData } from "@/lib/revenue/load";
import { answerQuestion } from "@/lib/ai/assistant";
import { aiConfigured } from "@/lib/ai/claude";
import { assertAiQueryAvailable, recordUsage } from "@/lib/billing";
import { audit } from "@/lib/audit";

export const maxDuration = 120;

const schema = z.object({ question: z.string().trim().min(2, "Ask a question").max(2000), conversationId: z.string().uuid().nullable().optional() });

/** Answers with the caller's own data: records are loaded through their session, so they only see what RLS allows. */
export const POST = handle(async (req: Request) => {
  const ctx = await requireUser("assistant.use");
  const { question, conversationId } = await parseBody(req, schema);
  if (aiConfigured()) await assertAiQueryAvailable(ctx.orgId);
  const supabase = await createClient();
  let convId = conversationId ?? null;
  let history: { role: "user" | "assistant"; content: string }[] = [];
  if (convId) {
    const { data: conv } = await supabase.from("ai_conversations").select("id").eq("id", convId).eq("user_id", ctx.userId).maybeSingle();
    if (!conv) throw new ApiError(404, "Conversation not found.");
    const { data: msgs } = await supabase.from("ai_messages").select("role, content").eq("conversation_id", convId).order("created_at").limit(20);
    history = (msgs ?? []) as typeof history;
  } else {
    const { data: conv, error } = await supabase.from("ai_conversations").insert({ org_id: ctx.orgId, user_id: ctx.userId, title: question.slice(0, 80) }).select("id").single();
    if (error) throw new ApiError(500, error.message);
    convId = conv.id;
  }
  const data = await loadOrgData(supabase, ctx.orgId);
  let answer;
  try {
    answer = await answerQuestion(question, history, data, { userId: ctx.userId, name: ctx.fullName });
  } catch (err) {
    throw new ApiError(502, `The AI service could not answer right now: ${(err as Error).message}`);
  }
  const admin = createAdminClient();
  await admin.from("ai_messages").insert([
    { org_id: ctx.orgId, conversation_id: convId, role: "user", content: question },
    { org_id: ctx.orgId, conversation_id: convId, role: "assistant", content: answer.text, evidence: answer.evidence },
  ]);
  await admin.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
  if (answer.mode === "ai") await recordUsage(ctx.orgId, ctx.userId, "ai_query");
  await audit({ orgId: ctx.orgId, userId: ctx.userId, action: "assistant.question", details: { mode: answer.mode } });
  return json({ conversationId: convId, ...answer });
});
