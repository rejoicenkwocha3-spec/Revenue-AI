"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Loader2, Trash2, UserPlus, X } from "lucide-react";
import { api } from "@/lib/client-api";
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, type Role } from "@/lib/permissions";
import { Notice } from "@/components/app/ui";
import { formatDate } from "@/lib/utils";

interface Member { userId: string; role: string; joined: string; name: string; email: string; teamId: string | null; territoryId: string | null }
type Opt = { id: string; name: string };

export function TeamClient({ me, myRole, manage, seats, members, invites, teams, territories }: { me: string; myRole: Role; manage: boolean; seats: number; members: Member[]; invites: { id: string; email: string; role: string; expires_at: string }[]; teams: Opt[]; territories: Opt[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("sales_rep");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ link: string; delivered: string } | null>(null);

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key); setError(null);
    try { await fn(); router.refresh(); } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }
  const used = members.length + invites.length;
  const assignable = ROLES.filter((r) => r !== "owner" && (r !== "admin" || myRole === "owner"));

  return (
    <div className="space-y-5">
      {error && <Notice tone="error">{error}</Notice>}
      {manage && (
        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Invite a teammate</h2>
            <span className="text-sm tabular-nums text-muted">{used} of {seats} seats used</span>
          </div>
          <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px_auto]" onSubmit={(e) => { e.preventDefault(); run("invite", async () => { setResult(await api("/api/team/invite", { body: { email, role } })); setEmail(""); }); }}>
            <label className="sr-only" htmlFor="ie">Email</label>
            <input id="ie" type="email" required className="input" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label className="sr-only" htmlFor="ir">Role</label>
            <select id="ir" className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {assignable.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            <button type="submit" className="btn btn-primary" disabled={busy === "invite" || used >= seats}>{busy === "invite" ? <Loader2 size={15} className="ra-spin" /> : <UserPlus size={15} />} Invite</button>
          </form>
          <p className="mt-2 text-xs text-muted">{ROLE_DESCRIPTIONS[role]}</p>
          {result && (
            <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-navy">
              <div className="flex justify-between gap-2">
                <p className="font-semibold">{result.delivered === "email" ? "Invitation emailed." : result.delivered === "notification" ? "They have a notification in Revenue AI." : "Share this invitation link:"} The link works for 14 days.</p>
                <button type="button" aria-label="Dismiss" onClick={() => setResult(null)}><X size={15} /></button>
              </div>
              <div className="mt-2 flex gap-2">
                <input readOnly aria-label="Invitation link" className="input py-1.5 text-xs" value={result.link} onFocus={(e) => e.target.select()} />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => navigator.clipboard.writeText(result.link).catch(() => undefined)}><Copy size={13} /> Copy</button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="card overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
            <th className="px-5 py-3 font-semibold">Member</th><th className="px-5 py-3 font-semibold">Role</th><th className="px-5 py-3 font-semibold">Team</th><th className="px-5 py-3 font-semibold">Territory</th><th className="px-5 py-3 font-semibold">Joined</th><th className="px-5 py-3" />
          </tr></thead>
          <tbody className="divide-y divide-line">
            {members.map((m) => {
              const editable = manage && m.userId !== me && m.role !== "owner" && (m.role !== "admin" || myRole === "owner");
              return (
                <tr key={m.userId}>
                  <td className="px-5 py-3"><p className="font-semibold text-navy">{m.name || m.email}{m.userId === me ? " (you)" : ""}</p><p className="text-xs text-muted">{m.email}</p></td>
                  <td className="px-5 py-3">
                    {editable ? (
                      <select aria-label={`Role for ${m.email}`} className="input w-44 py-1.5 text-sm" value={m.role} disabled={busy === m.userId} onChange={(e) => run(m.userId, () => api(`/api/team/members/${m.userId}`, { method: "PATCH", body: { role: e.target.value } }))}>
                        {assignable.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    ) : <span className="chip bg-canvas text-body">{ROLE_LABELS[m.role as Role]}</span>}
                  </td>
                  {(["teamId", "territoryId"] as const).map((k) => {
                    const list = k === "teamId" ? teams : territories;
                    const col = k === "teamId" ? "team_id" : "territory_id";
                    return <td key={k} className="px-5 py-3">{manage ? <select aria-label={`${k === "teamId" ? "Team" : "Territory"} for ${m.email}`} className="input w-36 py-1.5 text-sm" value={m[k] ?? ""} disabled={busy === m.userId} onChange={(e) => run(m.userId, () => api(`/api/team/members/${m.userId}`, { method: "PATCH", body: { [col]: e.target.value || null } }))}><option value="">None</option>{list.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select> : <span className="text-muted">{list.find((t) => t.id === m[k])?.name ?? "None"}</span>}</td>;
                  })}
                  <td className="px-5 py-3 text-muted">{formatDate(m.joined)}</td>
                  <td className="px-5 py-3 text-right">
                    {editable && <button type="button" className="rounded-lg p-2 text-muted hover:bg-danger-50 hover:text-danger" aria-label={`Remove ${m.email}`} onClick={() => run(m.userId, () => api(`/api/team/members/${m.userId}`, { method: "DELETE" }))}><Trash2 size={15} /></button>}
                  </td>
                </tr>
              );
            })}
            {invites.map((i) => (
              <tr key={i.id} className="bg-canvas/40">
                <td className="px-5 py-3"><p className="font-medium text-navy">{i.email}</p><p className="text-xs text-muted">Invitation pending until {formatDate(i.expires_at)}</p></td>
                <td className="px-5 py-3"><span className="chip bg-warning-50 text-warning">{ROLE_LABELS[i.role as Role]}</span></td>
                <td className="px-5 py-3" /><td className="px-5 py-3" /><td className="px-5 py-3 text-muted">Pending</td>
                <td className="px-5 py-3 text-right">{manage && <button type="button" className="btn btn-ghost btn-sm" onClick={() => run(i.id, () => api(`/api/team/invitations/${i.id}`, { method: "DELETE" }))}>Revoke</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold">Roles</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r} className="rounded-xl border border-line p-4">
              <dt className="font-semibold text-navy">{ROLE_LABELS[r]}</dt>
              <dd className="mt-1 text-sm text-muted">{ROLE_DESCRIPTIONS[r]}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
