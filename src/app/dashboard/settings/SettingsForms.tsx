"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/client-api";
import { createClient } from "@/lib/supabase/client";
import { validatePassword } from "@/components/auth/AuthUi";

function Msg({ m }: { m: { ok: boolean; text: string } | null }) {
  return m ? <p className={`text-sm ${m.ok ? "text-success" : "text-danger"}`}>{m.text}</p> : null;
}

export function SettingsForms({ fullName, jobTitle, email, orgName, currency, fiscal, canEditOrg, roleLabel }: { fullName: string; jobTitle: string; email: string; orgName: string; currency: string; fiscal: number; canEditOrg: boolean; roleLabel: string }) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [org, setOrg] = useState(orgName);
  const [title, setTitle] = useState(jobTitle);
  const [cur, setCur] = useState(currency);
  const [fy, setFy] = useState(String(fiscal));
  const [pw, setPw] = useState({ next: "", confirm: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Record<string, { ok: boolean; text: string } | null>>({});

  async function run(key: string, fn: () => Promise<string>) {
    setBusy(key); setMsgs((m) => ({ ...m, [key]: null }));
    try { const text = await fn(); setMsgs((m) => ({ ...m, [key]: { ok: true, text } })); router.refresh(); }
    catch (e) { setMsgs((m) => ({ ...m, [key]: { ok: false, text: (e as Error).message } })); }
    finally { setBusy(null); }
  }

  return (
    <>
      <section className="card p-6">
        <h2 className="text-lg font-bold">Profile</h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run("profile", async () => { await api("/api/profile", { method: "PATCH", body: { fullName: name, jobTitle: title } }); return "Profile saved."; }); }}>
          <div><label htmlFor="fn" className="label">Full name</label><input id="fn" className="input" value={name} onChange={(e) => setName(e.target.value)} minLength={2} required /></div>
          <div><label htmlFor="jt" className="label">Job title</label><input id="jt" className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><label htmlFor="em" className="label">Email</label><input id="em" className="input bg-canvas" value={email} disabled /></div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy === "profile"}>{busy === "profile" && <Loader2 size={14} className="ra-spin" />} Save profile</button>
            <Msg m={msgs.profile ?? null} />
          </div>
        </form>
      </section>
      <section className="card p-6">
        <h2 className="text-lg font-bold">Password</h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(e) => {
          e.preventDefault();
          run("pw", async () => {
            const err = validatePassword(pw.next);
            if (err) throw new Error(err);
            if (pw.next !== pw.confirm) throw new Error("The passwords do not match.");
            const { error } = await createClient().auth.updateUser({ password: pw.next });
            if (error) throw error;
            setPw({ next: "", confirm: "" });
            return "Password updated.";
          });
        }}>
          <div><label htmlFor="np" className="label">New password</label><input id="np" type="password" autoComplete="new-password" className="input" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
          <div><label htmlFor="cp" className="label">Confirm password</label><input id="cp" type="password" autoComplete="new-password" className="input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy === "pw"}>{busy === "pw" && <Loader2 size={14} className="ra-spin" />} Update password</button>
            <Msg m={msgs.pw ?? null} />
          </div>
        </form>
      </section>
      <section className="card p-6">
        <h2 className="text-lg font-bold">Organisation</h2>
        <p className="mt-1 text-sm text-muted">Your role: {roleLabel}</p>
        <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); run("org", async () => { await api("/api/organisation", { method: "PATCH", body: { name: org, currency: cur, fiscal_year_start_month: Number(fy) } }); return "Organisation saved."; }); }}>
          <div className="min-w-[220px] flex-1"><label htmlFor="on" className="label">Organisation name</label><input id="on" className="input" value={org} disabled={!canEditOrg} onChange={(e) => setOrg(e.target.value)} required /></div>
          <div><label htmlFor="cu" className="label">Currency</label><select id="cu" className="input" value={cur} disabled={!canEditOrg} onChange={(e) => setCur(e.target.value)}>{["USD", "EUR", "GBP", "NGN", "CAD", "AUD", "ZAR", "INR"].map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label htmlFor="fy" className="label">Fiscal year starts</label><select id="fy" className="input" value={fy} disabled={!canEditOrg} onChange={(e) => setFy(e.target.value)}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2026, i, 1).toLocaleDateString("en", { month: "long" })}</option>)}</select></div>
          {canEditOrg && <button type="submit" className="btn btn-outline btn-sm" disabled={busy === "org"}>Save</button>}
          <Msg m={msgs.org ?? null} />
        </form>
      </section>
    </>
  );
}
