"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { createClient } from "@/lib/supabase/client";
import { Users, Plus, X, AlertCircle, CheckCircle2, Building2 } from "lucide-react";
import Link from "next/link";

type Member = {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: { full_name: string | null; } | null;
};

type User = { id: string; email?: string; user_metadata?: Record<string, string> };
type OrgInfo = { id: string; name: string } | null;

const roleBadgeColor: Record<string, { bg: string; color: string }> = {
  owner: { bg: "#F0FDF4", color: "#16A34A" },
  administrator: { bg: "#EEF3FD", color: "#155EEF" },
  lecturer: { bg: "#FFF7ED", color: "#C2410C" },
  student: { bg: "#F5F8FC", color: "#64748B" },
  researcher: { bg: "#FDF4FF", color: "#7C3AED" },
  reviewer: { bg: "#FFFBEB", color: "#D97706" },
};

export default function TeamPage() {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<OrgInfo>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("student");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchData = useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("id", userId)
      .single();

    if (!profile?.organisation_id) { setLoading(false); return; }

    const { data: orgData } = await supabase
      .from("organisations")
      .select("id, name")
      .eq("id", profile.organisation_id)
      .single();

    if (orgData) setOrg(orgData);

    const { data: membersData } = await supabase
      .from("organisation_members")
      .select("id, user_id, role, joined_at, profiles(full_name)")
      .eq("organisation_id", profile.organisation_id)
      .order("joined_at", { ascending: false });

    setMembers(((membersData ?? []) as unknown as Member[]));
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUser(user);
      fetchData(user.id);
    });
  }, [fetchData]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteMsg(null);
    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const json = await res.json();
    if (res.ok) {
      setInviteMsg({ ok: true, text: `Invitation sent to ${inviteEmail}.` });
      setInviteEmail("");
      setShowInvite(false);
    } else {
      setInviteMsg({ ok: false, text: json.error ?? "Failed to send invitation." });
    }
    setInviting(false);
  }

  if (loading) return (
    <>
      <DashboardHeader title="Team" />
      <div style={{ padding: "2rem" }}><p style={{ color: "#64748B" }}>Loading...</p></div>
    </>
  );

  return (
    <>
      <DashboardHeader title="Team" user={{ name: user?.user_metadata?.full_name, email: user?.email }} />
      <div style={{ padding: "2rem", flex: 1, maxWidth: 900 }}>

        {!org ? (
          <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "4rem 2rem", textAlign: "center" }}>
            <Building2 size={40} color="#D1DCF0" style={{ marginBottom: "1rem" }} />
            <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.125rem", color: "#102A43", margin: "0 0 0.5rem" }}>No organisation yet</h3>
            <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: "0 0 1.5rem" }}>Create an organisation to invite team members, manage departments and collect submissions.</p>
            <Link href="/dashboard/organisations" className="btn-primary" style={{ display: "inline-flex" }}>
              <Plus size={15} style={{ marginRight: "0.5rem" }} /> Create Organisation
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.25rem", color: "#102A43", margin: "0 0 0.25rem" }}>{org.name}</h2>
                <p style={{ color: "#64748B", fontSize: "0.875rem", margin: 0 }}>{members.length} member{members.length !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setShowInvite(!showInvite)} className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Plus size={15} /> Invite Member
              </button>
            </div>

            {/* Invite form */}
            {showInvite && (
              <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1rem", color: "#102A43", margin: 0 }}>Invite a team member</h3>
                  <button onClick={() => setShowInvite(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}><X size={18} /></button>
                </div>
                <form onSubmit={sendInvite} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div style={{ flex: "1 1 220px" }}>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#263449", marginBottom: "0.3rem" }}>Email address</label>
                    <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required placeholder="colleague@institution.edu"
                      style={{ width: "100%", padding: "0.625rem 0.875rem", border: "1.5px solid #D1DCF0", borderRadius: 8, fontSize: "0.9rem", color: "#263449", background: "#ffffff", outline: "none" }}
                      onFocus={(e) => (e.target.style.border = "1.5px solid #155EEF")}
                      onBlur={(e) => (e.target.style.border = "1.5px solid #D1DCF0")} />
                  </div>
                  <div style={{ flex: "0 0 160px" }}>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#263449", marginBottom: "0.3rem" }}>Role</label>
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                      style={{ width: "100%", padding: "0.625rem 0.875rem", border: "1.5px solid #D1DCF0", borderRadius: 8, fontSize: "0.9rem", color: "#263449", background: "#ffffff", outline: "none" }}>
                      <option value="student">Student</option>
                      <option value="lecturer">Lecturer</option>
                      <option value="researcher">Researcher</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="administrator">Administrator</option>
                    </select>
                  </div>
                  <button type="submit" disabled={inviting} className="btn-primary" style={{ padding: "0.625rem 1.25rem", fontSize: "0.875rem", opacity: inviting ? 0.7 : 1 }}>
                    {inviting ? "Sending..." : "Send Invite"}
                  </button>
                </form>
              </div>
            )}

            {inviteMsg && (
              <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", padding: "0.75rem 1rem", borderRadius: 8, background: inviteMsg.ok ? "#F0FDF4" : "#FFF5F5", border: `1px solid ${inviteMsg.ok ? "#BBF7D0" : "#FCC"}`, marginBottom: "1rem" }}>
                {inviteMsg.ok ? <CheckCircle2 size={16} color="#16A34A" /> : <AlertCircle size={16} color="#D44" />}
                <span style={{ fontSize: "0.875rem", color: inviteMsg.ok ? "#166534" : "#922" }}>{inviteMsg.text}</span>
              </div>
            )}

            {members.length === 0 ? (
              <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "3rem 2rem", textAlign: "center" }}>
                <Users size={36} color="#D1DCF0" style={{ marginBottom: "1rem" }} />
                <p style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, color: "#102A43", margin: "0 0 0.5rem" }}>No members yet</p>
                <p style={{ color: "#64748B", fontSize: "0.9rem", margin: 0 }}>Invite team members to get started.</p>
              </div>
            ) : (
              <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F5F8FC" }}>
                      {["Name", "Role", "Joined"].map((h) => (
                        <th key={h} style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const badge = roleBadgeColor[m.role] ?? { bg: "#F5F8FC", color: "#64748B" };
                      return (
                        <tr key={m.id} style={{ borderTop: "1px solid #F5F8FC" }}>
                          <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.9rem", color: "#102A43", fontWeight: 500 }}>
                            {m.profiles?.full_name ?? m.user_id.slice(0, 8) + "..."}
                          </td>
                          <td style={{ padding: "0.875rem 1.25rem" }}>
                            <span style={{ background: badge.bg, color: badge.color, fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: 100, textTransform: "capitalize" }}>{m.role}</span>
                          </td>
                          <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.875rem", color: "#64748B" }}>
                            {new Date(m.joined_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
