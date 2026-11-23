"use client";

import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { MessageSquare, Send, AlertCircle, Info, Loader2 } from "lucide-react";

type Task = { key: string; label: string; desc: string };

const tasks: Task[] = [
  { key: "improve", label: "Improve Writing", desc: "Get suggestions to improve clarity, academic tone and coherence." },
  { key: "grammar", label: "Grammar Review", desc: "Identify grammar and punctuation issues with correction suggestions." },
  { key: "citations", label: "Citation Advice", desc: "Review citation formatting and identify passages that may need a citation." },
  { key: "structure", label: "Structure Review", desc: "Analyse paragraph organisation and logical flow." },
  { key: "tone", label: "Academic Tone", desc: "Evaluate whether the writing achieves an appropriate academic register." },
];

export default function WritingAssistantPage() {
  const [task, setTask] = useState("improve");
  const [text, setText] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) { setError("Please enter some text to analyse."); return; }
    setError(""); setResponse(""); setLoading(true);

    try {
      const res = await fetch("/api/writing-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, task }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResponse(data.response ?? "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DashboardHeader title="Writing Assistant" />
      <div style={{ padding: "2rem", flex: 1, maxWidth: 900 }}>
        <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: "0 0 0.5rem" }}>
          Paste a passage from your document and select a review type to receive targeted academic writing feedback.
        </p>
        <div style={{ background: "#FFF7F5", border: "1px solid #FFD6CF", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1.5rem", display: "flex", gap: "0.625rem" }}>
          <Info size={16} color="#FF654F" style={{ flexShrink: 0, marginTop: "0.1rem" }} />
          <p style={{ color: "#7C3A30", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
            The Writing Assistant provides suggestions only. It will not rewrite your work. It does not fabricate citations or sources. All suggestions should be reviewed and applied by you.
          </p>
        </div>

        {/* Task selector */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {tasks.map((t) => (
            <button key={t.key} type="button" onClick={() => setTask(t.key)}
              style={{ padding: "0.5rem 1.125rem", borderRadius: 8, border: task === t.key ? "1.5px solid #155EEF" : "1.5px solid #D1DCF0", background: task === t.key ? "#EEF3FD" : "#ffffff", color: task === t.key ? "#155EEF" : "#64748B", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", transition: "all 0.15s" }}>
              {t.label}
            </button>
          ))}
        </div>
        <p style={{ color: "#64748B", fontSize: "0.875rem", margin: "0 0 1.25rem" }}>
          {tasks.find(t => t.key === task)?.desc}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#263449", marginBottom: "0.375rem" }}>
              Your text (up to 3,000 words)
            </label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} required rows={10}
              placeholder="Paste a passage from your document here for review..."
              style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D1DCF0", borderRadius: 8, fontSize: "0.9375rem", color: "#263449", background: "#ffffff", outline: "none", resize: "vertical", lineHeight: 1.7, fontFamily: "var(--font-inter)" }}
              onFocus={(e) => (e.target.style.border = "1.5px solid #155EEF")}
              onBlur={(e) => (e.target.style.border = "1.5px solid #D1DCF0")}
            />
            <p style={{ color: "#94A3B8", fontSize: "0.8125rem", margin: "0.375rem 0 0" }}>
              {text.split(/\s+/).filter(Boolean).length} words
            </p>
          </div>

          {error && (
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", background: "#FFF5F5", border: "1px solid #FCC", borderRadius: 8, padding: "0.875rem 1rem" }}>
              <AlertCircle size={16} color="#D44" style={{ flexShrink: 0 }} />
              <p style={{ color: "#922", fontSize: "0.875rem", margin: 0 }}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary" style={{ maxWidth: 200, justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Analysing...</> : <><Send size={15} /> Get Feedback</>}
          </button>
        </form>

        {response && (
          <div style={{ marginTop: "2rem", background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "1.5rem", boxShadow: "0 1px 4px rgba(16,42,67,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid #D1DCF0" }}>
              <div style={{ width: 32, height: 32, background: "#EEF3FD", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageSquare size={16} color="#155EEF" />
              </div>
              <p style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9375rem", color: "#102A43", margin: 0 }}>
                {tasks.find(t => t.key === task)?.label} Feedback
              </p>
            </div>
            <div style={{ color: "#263449", fontSize: "0.9375rem", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{response}</div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
