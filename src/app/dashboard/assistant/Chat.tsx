"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { api } from "@/lib/client-api";
import { Evidence } from "@/components/app/ui";

interface Msg { role: "user" | "assistant"; content: string; evidence?: { label: string; value: string }[]; mode?: string }

const EXAMPLES = [
  "How much revenue are we likely to generate this quarter?",
  "Which deals are most likely to close?",
  "Which opportunities are at risk?",
  "Why is our pipeline declining?",
  "Which sales representatives are performing best?",
  "Which deals have been inactive?",
  "What should our team prioritise today?",
  "Which customers have expansion opportunities?",
  "Are we on track to hit our revenue target?",
];

/** Lightweight formatting: paragraphs and bullet lines, no HTML injection. */
function Rich({ text }: { text: string }) {
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {text.split("\n").map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} className="h-1" />;
        const bullet = /^([*\-•]|\d+\.)\s+/.test(t);
        const clean = t.replace(/^([*\-•])\s+/, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#+\s*/, "");
        return bullet ? <p key={i} className="flex gap-2 pl-1"><span className="text-blue">•</span><span>{clean.replace(/^\d+\.\s+/, "")}</span></p> : <p key={i}>{clean}</p>;
      })}
    </div>
  );
}

export function Chat({ initialQuestion, conversationId: initialConv, history, aiOn }: { initialQuestion?: string; conversationId?: string | null; history: Msg[]; aiOn: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>(history);
  const [conv, setConv] = useState<string | null>(initialConv ?? null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const asked = useRef(false);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setMsgs((m) => [...m, { role: "user", content: question }]);
    setQ(""); setBusy(true); setError(null);
    try {
      const r = await api<{ conversationId: string; text: string; evidence: Msg["evidence"]; mode: string }>("/api/assistant", { body: { question, conversationId: conv } });
      setConv(r.conversationId);
      setMsgs((m) => [...m, { role: "assistant", content: r.text, evidence: r.evidence, mode: r.mode }]);
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  }
  useEffect(() => { if (initialQuestion && !asked.current) { asked.current = true; ask(initialQuestion); } });
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);

  return (
    <div className="card flex min-h-[560px] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {msgs.length === 0 && (
          <div>
            <p className="text-sm text-muted">Ask about your pipeline, forecast, deals, customers or team. Answers use only your organisation&apos;s records{aiOn ? "" : " and are computed directly from them"}.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLES.map((e) => <button key={e} type="button" onClick={() => ask(e)} className="rounded-full border border-line bg-white px-3 py-1.5 text-left text-xs font-medium text-ink hover:border-blue hover:text-blue">{e}</button>)}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={m.role === "user" ? "max-w-[85%] rounded-2xl rounded-br-md bg-navy px-4 py-2.5 text-sm text-white" : "max-w-[92%] rounded-2xl rounded-bl-md border border-line bg-white px-4 py-3 text-ink"}>
              {m.role === "assistant" ? <><p className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold text-purple"><Sparkles size={12} />Revenue AI{m.mode === "rules" && " (computed from records)"}</p><Rich text={m.content} /><Evidence items={m.evidence ?? []} /></> : m.content}
            </div>
          </div>
        ))}
        {busy && <p className="inline-flex items-center gap-2 text-sm text-muted"><Loader2 size={14} className="ra-spin" />Reading your revenue data</p>}
        {error && <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-[#8A1C26]">{error}</p>}
        <div ref={end} />
      </div>
      <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <label htmlFor="ask" className="sr-only">Ask a question</label>
        <input id="ask" className="input" placeholder="Ask about revenue, deals, forecasts or customers" value={q} onChange={(e) => setQ(e.target.value)} maxLength={2000} />
        <button className="btn btn-primary" disabled={busy || !q.trim()} aria-label="Send"><Send size={16} /></button>
      </form>
    </div>
  );
}
