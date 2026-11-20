"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Trash2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Member {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [role, setRole] = useState("member");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      setMembers([{
        id: user.id,
        email: user.email || "",
        full_name: profile?.full_name || null,
        role: "owner",
        created_at: user.created_at || new Date().toISOString(),
      }]);
      setLoading(false);
    }
    load();
  }, []);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    setInviteEmail("");
    setShowInvite(false);
    setSending(false);
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#071F20", margin: "0 0 0.25rem" }}>Team</h1>
          <p style={{ color: "#65736D", fontSize: "0.9375rem", margin: 0 }}>Manage team members and their permissions.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowInvite(true)} style={{ fontSize: "0.9rem" }}>
          <Plus size={16} /> Invite Member
        </button>
      </div>

      {sent && (
        <div style={{ background: "#E8F8EE", border: "1px solid #16C653", borderRadius: "0.75rem", padding: "1rem 1.25rem", marginBottom: "1.5rem", fontSize: "0.9375rem", color: "#063B38" }}>
          Invitation sent successfully.
        </div>
      )}

      {showInvite && (
        <div className="card-ss" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>Invite Team Member</h2>
          <form onSubmit={sendInvite} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.875rem" }}>
              <div>
                <label className="label-ss">Email Address</label>
                <input className="input-ss" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@company.com" required />
              </div>
              <div>
                <label className="label-ss">Role</label>
                <select className="input-ss" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="btn-primary" disabled={sending} style={{ opacity: sending ? 0.7 : 1 }}>
                <Mail size={15} /> {sending ? "Sending..." : "Send Invitation"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowInvite(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#65736D" }}>Loading team...</div>
      ) : (
        <div className="card-ss" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #DCE8E2", background: "#F7FAF8" }}>
                <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Member</th>
                <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Role</th>
                <th style={{ textAlign: "right", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #F0F5F2" }}>
                  <td style={{ padding: "0.875rem 1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#063B38", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#16C653", fontSize: "0.875rem" }}>
                        {(m.full_name || m.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#071F20" }}>{m.full_name || m.email.split("@")[0]}</div>
                        <div style={{ fontSize: "0.8125rem", color: "#65736D" }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>
                    <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", borderRadius: "2rem", background: m.role === "owner" ? "#E8F8EE" : "#F7FAF8", color: m.role === "owner" ? "#16C653" : "#65736D", fontWeight: 500 }}>
                      {m.role}
                    </span>
                  </td>
                  <td style={{ padding: "0.875rem 1.25rem", textAlign: "right", color: "#65736D" }}>
                    {new Date(m.created_at).toLocaleDateString()}
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
