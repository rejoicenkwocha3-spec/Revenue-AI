"use client";

import { useEffect, useState } from "react";
import { Plus, Copy, Eye, EyeOff, Trash2, KeyRound, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string;
  created_at: string;
  last_used_at: string | null;
}

function generateKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "ss_live_";
  for (let i = 0; i < 32; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState("read");
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [copied, setCopied] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
    setKeys(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const fullKey = generateKey();
    const prefix = fullKey.substring(0, 12);

    const { error } = await supabase.from("api_keys").insert({
      name: name.trim(),
      key_prefix: prefix,
      key_hash: fullKey,
      permissions,
      user_id: user.id,
    });

    if (!error) {
      setNewKey(fullKey);
      setName(""); setShowNew(false);
      await load();
    }
    setSaving(false);
  }

  async function deleteKey(id: string) {
    if (!confirm("Revoke this API key? Any integrations using it will stop working.")) return;
    const supabase = createClient();
    await supabase.from("api_keys").delete().eq("id", id);
    await load();
  }

  async function copyKey(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#071F20", margin: "0 0 0.25rem" }}>API Keys</h1>
          <p style={{ color: "#65736D", fontSize: "0.9375rem", margin: 0 }}>Manage API keys for integrating SearchSprout into your applications.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)} style={{ fontSize: "0.9rem" }}>
          <Plus size={16} /> Generate Key
        </button>
      </div>

      {/* New key revealed */}
      {newKey && (
        <div style={{ background: "#E8F8EE", border: "1px solid #16C653", borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <CheckCircle2 size={18} color="#16C653" />
            <span style={{ fontWeight: 700, color: "#063B38" }}>API key generated. Copy it now. It will not be shown again.</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#FFFFFF", borderRadius: "0.5rem", padding: "0.75rem 1rem", border: "1px solid #DCE8E2" }}>
            <code style={{ flex: 1, fontSize: "0.875rem", fontFamily: "monospace", color: "#071F20", overflowX: "auto" }}>{newKey}</code>
            <button onClick={() => copyKey(newKey)} className="btn-primary" style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}>
              {copied ? "Copied" : <><Copy size={14} /> Copy</>}
            </button>
          </div>
          <button onClick={() => setNewKey("")} style={{ marginTop: "0.75rem", background: "none", border: "none", cursor: "pointer", color: "#65736D", fontSize: "0.875rem" }}>
            I have saved my key
          </button>
        </div>
      )}

      {showNew && (
        <div className="card-ss" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>Generate API Key</h2>
          <form onSubmit={createKey} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div>
              <label className="label-ss">Key Name</label>
              <input className="input-ss" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Production App" required />
            </div>
            <div>
              <label className="label-ss">Permissions</label>
              <select className="input-ss" value={permissions} onChange={(e) => setPermissions(e.target.value)}>
                <option value="read">Read only (search queries)</option>
                <option value="write">Read and write (indexing)</option>
                <option value="admin">Admin (full access)</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? "Generating..." : "Generate Key"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#65736D" }}>Loading API keys...</div>
      ) : keys.length === 0 ? (
        <div className="card-ss" style={{ textAlign: "center", padding: "3rem" }}>
          <KeyRound size={40} color="#DCE8E2" style={{ marginBottom: "1rem" }} />
          <h3 style={{ marginBottom: "0.5rem" }}>No API keys yet</h3>
          <p style={{ color: "#65736D", marginBottom: "1.5rem" }}>Generate your first API key to start integrating SearchSprout.</p>
          <button className="btn-primary" onClick={() => setShowNew(true)}>
            <Plus size={16} /> Generate Key
          </button>
        </div>
      ) : (
        <div className="card-ss" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #DCE8E2", background: "#F7FAF8" }}>
                <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Name</th>
                <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Key</th>
                <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Permissions</th>
                <th style={{ textAlign: "right", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Created</th>
                <th style={{ padding: "0.875rem 1.25rem" }} />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} style={{ borderBottom: "1px solid #F0F5F2" }}>
                  <td style={{ padding: "0.875rem 1.25rem", fontWeight: 500, color: "#071F20" }}>{k.name}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>
                    <code style={{ fontSize: "0.875rem", fontFamily: "monospace", color: "#65736D" }}>{k.key_prefix}...</code>
                  </td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>
                    <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", borderRadius: "2rem", background: "#E8F8EE", color: "#063B38", fontWeight: 500 }}>{k.permissions}</span>
                  </td>
                  <td style={{ padding: "0.875rem 1.25rem", textAlign: "right", color: "#65736D" }}>{new Date(k.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "0.875rem 1.25rem", textAlign: "right" }}>
                    <button onClick={() => deleteKey(k.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#DCE8E2" }}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
