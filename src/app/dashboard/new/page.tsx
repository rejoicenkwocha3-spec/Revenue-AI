"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";
import { createClient } from "@/lib/supabase/client";
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from "lucide-react";

const ACCEPTED = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
const ACCEPTED_EXT = ".pdf,.docx,.txt";
const MAX_MB = 20;

export default function NewAnalysisPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState({ excludeBibliography: true, excludeQuotes: false, checkAI: true, checkCitations: true, checkGrammar: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  function handleFile(f: File) {
    if (!ACCEPTED.includes(f.type) && !f.name.endsWith(".txt")) {
      setError("Please upload a PDF, DOCX or TXT file.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File size must be under ${MAX_MB}MB.`);
      return;
    }
    setError("");
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "upload" && !file) { setError("Please select a file to upload."); return; }
    if (mode === "paste" && !text.trim()) { setError("Please paste or type your text."); return; }
    if (!title.trim()) { setError("Please enter a document title."); return; }
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      let storagePath: string | null = null;

      if (mode === "upload" && file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("documents").upload(path, file);
        if (uploadErr) throw new Error(uploadErr.message);
        storagePath = path;
      }

      const { data: doc, error: dbErr } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title: title.trim(),
          status: "queued",
          file_path: storagePath,
          content_text: mode === "paste" ? text : null,
          options: options,
        })
        .select("id")
        .single();

      if (dbErr) throw new Error(dbErr.message);

      // Trigger analysis via API route
      await fetch("/api/analysis/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id, options }),
      });

      router.push(`/dashboard/documents/${doc.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <DashboardHeader title="New Analysis" />
      <div style={{ padding: "2rem", maxWidth: 760, flex: 1 }}>
        <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: "0 0 2rem" }}>
          Submit a document for originality checking, AI writing analysis, citation review and grammar feedback.
        </p>

        {error && (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", background: "#FFF5F5", border: "1px solid #FCC", borderRadius: 8, padding: "0.875rem 1rem", marginBottom: "1.5rem" }}>
            <AlertCircle size={18} color="#D44" style={{ flexShrink: 0 }} />
            <p style={{ color: "#922", fontSize: "0.9rem", margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Title */}
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#263449", marginBottom: "0.375rem" }}>Document title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Research Paper Draft 1"
              style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #D1DCF0", borderRadius: 8, fontSize: "0.9375rem", color: "#263449", background: "#ffffff", outline: "none" }}
              onFocus={(e) => (e.target.style.border = "1.5px solid #155EEF")}
              onBlur={(e) => (e.target.style.border = "1.5px solid #D1DCF0")}
            />
          </div>

          {/* Mode switch */}
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#263449", marginBottom: "0.5rem" }}>Submission method</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["upload", "paste"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  style={{ padding: "0.5rem 1.25rem", borderRadius: 8, border: mode === m ? "1.5px solid #155EEF" : "1.5px solid #D1DCF0", background: mode === m ? "#EEF3FD" : "#ffffff", color: mode === m ? "#155EEF" : "#64748B", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
                  {m === "upload" ? "Upload File" : "Paste Text"}
                </button>
              ))}
            </div>
          </div>

          {/* Upload area */}
          {mode === "upload" && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${drag ? "#155EEF" : file ? "#155EEF" : "#D1DCF0"}`,
                borderRadius: 12,
                padding: "2.5rem 2rem",
                textAlign: "center",
                cursor: "pointer",
                background: file ? "#EEF3FD" : drag ? "#F0F5FF" : "#F5F8FC",
                transition: "border 0.2s, background 0.2s",
              }}
            >
              <input ref={fileRef} type="file" accept={ACCEPTED_EXT} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {file ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "center" }}>
                  <CheckCircle2 size={24} color="#155EEF" />
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontWeight: 600, color: "#102A43", margin: 0 }}>{file.name}</p>
                    <p style={{ color: "#64748B", fontSize: "0.8125rem", margin: 0 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", marginLeft: "auto" }}>
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={32} color="#D1DCF0" style={{ marginBottom: "0.75rem" }} />
                  <p style={{ fontWeight: 600, color: "#102A43", margin: "0 0 0.375rem" }}>Drop your file here or click to browse</p>
                  <p style={{ color: "#64748B", fontSize: "0.875rem", margin: 0 }}>PDF, DOCX or TXT up to {MAX_MB}MB</p>
                </>
              )}
            </div>
          )}

          {/* Paste area */}
          {mode === "paste" && (
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#263449", marginBottom: "0.375rem" }}>Document text</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} required placeholder="Paste or type your document text here..."
                rows={12}
                style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D1DCF0", borderRadius: 8, fontSize: "0.9375rem", color: "#263449", background: "#ffffff", outline: "none", resize: "vertical", lineHeight: 1.7, fontFamily: "var(--font-inter)" }}
                onFocus={(e) => (e.target.style.border = "1.5px solid #155EEF")}
                onBlur={(e) => (e.target.style.border = "1.5px solid #D1DCF0")}
              />
              <p style={{ color: "#94A3B8", fontSize: "0.8125rem", margin: "0.375rem 0 0" }}>{text.split(/\s+/).filter(Boolean).length} words</p>
            </div>
          )}

          {/* Analysis options */}
          <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "1.25rem 1.5rem" }}>
            <p style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9375rem", color: "#102A43", margin: "0 0 1rem" }}>Analysis options</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { key: "excludeBibliography", label: "Exclude bibliography and references section from similarity check" },
                { key: "excludeQuotes", label: "Exclude directly quoted passages from similarity check" },
                { key: "checkAI", label: "Include AI writing indicator analysis" },
                { key: "checkCitations", label: "Include citation format review" },
                { key: "checkGrammar", label: "Include grammar and writing analysis" },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", color: "#263449", fontSize: "0.9rem" }}>
                  <input type="checkbox" checked={options[key as keyof typeof options]} onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: "#155EEF" }} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: "center", maxWidth: 240, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Submitting..." : "Start Analysis"}
          </button>
        </form>
      </div>
    </>
  );
}
