"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, MessageSquare, AlertCircle, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What is our total carbon footprint?",
  "Which activities contribute most to our emissions?",
  "What are our highest emitting operations?",
  "How have our emissions changed over time?",
  "What are our biggest Scope 3 emission sources?",
  "Recommend opportunities to reduce our emissions.",
  "Generate a sustainability performance summary.",
  "Explain the difference between Scope 1, 2 and 3 emissions.",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setError("");

    const newMessages: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("Failed to get a response.");
      const { reply } = await res.json();
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", padding: "0" }}>
      {/* Header */}
      <div style={{ padding: "1.5rem 2.5rem", borderBottom: "1px solid #DDE8E2", background: "#FFFFFF", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 36, height: 36, background: "#0B352B", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={18} style={{ color: "#D9AD55" }} />
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.25rem", color: "#0B352B" }}>AI Climate Assistant</h1>
            <p style={{ fontSize: "0.8rem", color: "#5A6B61" }}>Analyses your actual emissions data to surface insights and recommendations</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {messages.length === 0 && (
          <div>
            <div style={{ textAlign: "center", padding: "2rem 0 2.5rem" }}>
              <div style={{ width: 56, height: 56, background: "#0B352B", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                <MessageSquare size={24} style={{ color: "#D9AD55" }} />
              </div>
              <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.25rem", color: "#0B352B", marginBottom: "0.5rem" }}>
                How can I help with your climate data?
              </h2>
              <p style={{ color: "#5A6B61", fontSize: "0.875rem", maxWidth: "420px", margin: "0 auto", lineHeight: 1.65 }}>
                I analyse your actual emissions records to answer questions, surface insights and help prepare sustainability disclosures. I will not fabricate data or claim compliance without evidence.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.625rem", maxWidth: "760px", margin: "0 auto" }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  style={{
                    background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "0.75rem",
                    padding: "0.875rem 1rem", textAlign: "left", cursor: "pointer",
                    fontSize: "0.8125rem", color: "#242B27", lineHeight: 1.5,
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#8BAF91";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(23,77,54,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#DDE8E2";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "680px",
              background: m.role === "user" ? "#174D36" : "#FFFFFF",
              color: m.role === "user" ? "#FFFFFF" : "#242B27",
              border: m.role === "assistant" ? "1px solid #DDE8E2" : "none",
              borderRadius: m.role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
              padding: "0.875rem 1.125rem",
              fontSize: "0.9rem",
              lineHeight: 1.7,
              boxShadow: m.role === "assistant" ? "0 1px 4px rgba(11,53,43,0.06)" : "none",
              whiteSpace: "pre-wrap",
            }}>
              {m.role === "assistant" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem", paddingBottom: "0.5rem", borderBottom: "1px solid #F0F5F2" }}>
                  <Sparkles size={12} style={{ color: "#D9AD55" }} />
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#5A6B61", textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Climate Assistant</span>
                </div>
              )}
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "1rem 1rem 1rem 0.25rem", padding: "1rem 1.25rem", display: "flex", gap: "0.375rem", alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#8BAF91", animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "0.75rem", padding: "0.875rem 1rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <AlertCircle size={15} style={{ color: "#DC2626", flexShrink: 0, marginTop: "0.1rem" }} />
            <span style={{ fontSize: "0.875rem", color: "#DC2626" }}>{error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "1rem 2.5rem 1.5rem", borderTop: "1px solid #DDE8E2", background: "#FFFFFF", flexShrink: 0 }}>
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} style={{ display: "flex", gap: "0.75rem" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input-cb"
            placeholder="Ask about your emissions data..."
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary"
            style={{ padding: "0.6875rem 1.125rem", opacity: loading || !input.trim() ? 0.5 : 1 }}
          >
            <Send size={16} />
          </button>
        </form>
        <p style={{ fontSize: "0.75rem", color: "#9BAF9A", marginTop: "0.5rem" }}>
          Responses are grounded in your actual emissions data and approved climate accounting references.
        </p>
      </div>

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
      `}</style>
    </div>
  );
}
