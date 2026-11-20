"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "What are the most popular search queries this week?",
  "Which queries are returning zero results?",
  "Summarise my search analytics performance.",
  "What content should I add to improve search coverage?",
  "How can I improve my click-through rate?",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello. I am your SearchSprout AI assistant. I can help you understand your search analytics, find content gaps, and suggest ways to improve your search experience. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const userMessage = text || input.trim();
    if (!userMessage) return;

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          context: "search_analytics"
        }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response || data.message || "I could not generate a response. Please try again." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "I encountered an error. Please check that an AI API key is configured in your settings and try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#071F20", margin: "0 0 0.25rem" }}>AI Search Assistant</h1>
        <p style={{ color: "#65736D", fontSize: "0.9375rem", margin: 0 }}>Ask questions about your search performance and get AI-powered insights grounded in your data.</p>
      </div>

      {/* Chat */}
      <div className="card-ss" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "72%",
                padding: "0.875rem 1.125rem",
                borderRadius: m.role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                background: m.role === "user" ? "#063B38" : "#F7FAF8",
                color: m.role === "user" ? "#FFFFFF" : "#071F20",
                fontSize: "0.9375rem",
                lineHeight: 1.65,
                border: m.role === "assistant" ? "1px solid #DCE8E2" : "none",
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ padding: "0.875rem 1.125rem", borderRadius: "1rem 1rem 1rem 0.25rem", background: "#F7FAF8", border: "1px solid #DCE8E2", display: "flex", alignItems: "center", gap: "0.5rem", color: "#65736D", fontSize: "0.875rem" }}>
                <Loader2 size={15} className="spin" /> Thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div style={{ padding: "0 1.5rem 1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {suggestions.map((s) => (
              <button key={s} onClick={() => sendMessage(s)} style={{ padding: "0.375rem 0.875rem", borderRadius: "2rem", border: "1px solid #DCE8E2", background: "#FFFFFF", color: "#063B38", fontSize: "0.8125rem", cursor: "pointer" }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid #DCE8E2", display: "flex", gap: "0.75rem" }}>
          <input
            className="input-ss"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask about your search performance..."
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button
            className="btn-primary"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{ padding: "0.625rem 1rem", opacity: loading || !input.trim() ? 0.5 : 1 }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
