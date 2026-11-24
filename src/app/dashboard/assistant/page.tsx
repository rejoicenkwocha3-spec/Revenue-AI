import Link from "next/link";
import { pageData } from "@/lib/page";
import { aiConfigured } from "@/lib/ai/claude";
import { getEntitlements } from "@/lib/billing";
import { PageHeader, Card, Notice } from "@/components/app/ui";
import { timeAgo, cn } from "@/lib/utils";
import { Chat } from "./Chat";

export const metadata = { title: "AI Assistant" };

export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ q?: string; c?: string }> }) {
  const sp = await searchParams;
  const { ctx, supabase } = await pageData();
  const aiOn = aiConfigured();
  const ent = await getEntitlements(ctx.orgId);
  const { data: convs } = await supabase.from("ai_conversations").select("id, title, updated_at").eq("user_id", ctx.userId).eq("org_id", ctx.orgId).order("updated_at", { ascending: false }).limit(20);
  const current = sp.c && (convs ?? []).some((c) => c.id === sp.c) ? sp.c : null;
  const { data: msgs } = current ? await supabase.from("ai_messages").select("role, content, evidence").eq("conversation_id", current).order("created_at") : { data: [] };
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader title="AI Assistant" description="Ask questions about your business. Answers are grounded in your organisation's records and only use data your role can see. Projections are labelled." actions={<Link href="/dashboard/assistant" className="btn btn-outline btn-sm">New conversation</Link>} />
      {!aiOn && <Notice tone="warning">Conversational AI is not configured on this server (ANTHROPIC_API_KEY). Common questions are still answered directly from your records.</Notice>}
      {aiOn && <p className="text-xs text-muted">{ent.aiQueriesUsed} of {ent.aiQueriesPerMonth} AI questions used this month on the {ent.planName} plan.</p>}
      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <Chat key={current ?? "new"} initialQuestion={current ? undefined : sp.q} conversationId={current} history={(msgs ?? []) as { role: "user" | "assistant"; content: string }[]} aiOn={aiOn} />
        <Card title="Recent conversations" bodyClass="p-2">
          {(convs ?? []).length ? (
            <ul>{(convs ?? []).map((c) => <li key={c.id}><Link href={`/dashboard/assistant?c=${c.id}`} className={cn("block rounded-lg px-3 py-2 text-sm hover:bg-canvas", c.id === current && "bg-blue-50")}><span className="line-clamp-2 font-medium text-ink">{c.title}</span><span className="text-xs text-muted">{timeAgo(c.updated_at)}</span></Link></li>)}</ul>
          ) : <p className="p-3 text-sm text-muted">Your conversations appear here.</p>}
        </Card>
      </div>
    </div>
  );
}
