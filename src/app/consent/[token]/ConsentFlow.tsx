"use client";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Mic, Square, Loader2, CheckCircle2, Mail, UploadCloud } from "lucide-react";
import { createClient, supabaseReady } from "@/lib/supabase/client";
import { uploadToSignedUrl } from "@/lib/upload";
import { FormMessage } from "@/components/auth/AuthUi";

interface Consent { ownerName: string; ownerEmail: string; orgName: string; statement: string; status: string; commercialUse: boolean }

export function ConsentFlow({ token, consent }: { token: string; consent: Consent }) {
  const [sessionEmail, setSessionEmail] = useState<string | null | undefined>(undefined);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [recording, setRecording] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [signature, setSignature] = useState("");
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"verified" | "declined" | null>(consent.status === "verified" ? "verified" : consent.status === "revoked" ? "declined" : null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (!supabaseReady()) return setSessionEmail(null);
    createClient().auth.getUser().then(({ data }) => setSessionEmail(data.user?.email?.toLowerCase() ?? null));
  }, []);
  const verified = sessionEmail === consent.ownerEmail.toLowerCase();

  async function sendLink() {
    setError(null); setBusy(true);
    const { error } = await createClient().auth.signInWithOtp({
      email: consent.ownerEmail,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/consent/${token}`)}` },
    });
    setBusy(false);
    if (error) return setError(error.message);
    setSent(true);
  }
  async function verifyCode() {
    setError(null); setBusy(true);
    const { data, error } = await createClient().auth.verifyOtp({ email: consent.ownerEmail, token: code.trim(), type: "email" });
    setBusy(false);
    if (error) return setError(error.message);
    setSessionEmail(data.user?.email?.toLowerCase() ?? null);
  }
  async function startRec() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => { setRecording(new Blob(chunks.current, { type: rec.mimeType || "audio/webm" })); stream.getTracks().forEach((t) => t.stop()); };
      rec.start();
      recRef.current = rec;
      setIsRecording(true);
    } catch {
      setError("Microphone access was blocked. Allow it, or upload a recording instead.");
    }
  }
  function stopRec() { recRef.current?.stop(); setIsRecording(false); }

  async function submit(decision: "accept" | "decline") {
    setError(null); setBusy(true);
    try {
      let recordingPath = "";
      if (decision === "accept") {
        if (!recording) throw new Error("Record yourself reading the statement.");
        const type = (recording.type || "audio/webm").split(";")[0];
        const prep = await fetch(`/api/consent/${token}/upload-url`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mimeType: type, sizeBytes: recording.size }) });
        const p = await prep.json();
        if (!prep.ok) throw new Error(p.error);
        await uploadToSignedUrl(p.signedUrl, new File([recording], "consent", { type }), () => undefined);
        recordingPath = p.path;
      }
      const res = await fetch(`/api/consent/${token}/complete`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision, signatureName: signature, recordingPath, confirmOwner: c1, confirmUse: c2 }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setDone(d.status);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <CheckCircle2 size={36} className="mx-auto text-success" />
        <h1 className="mt-4 text-2xl font-extrabold">{done === "verified" ? "Consent recorded" : "Request declined"}</h1>
        <p className="mt-2 text-muted">
          {done === "verified" ? `${consent.orgName} can now create a replica of your voice. You can ask them to revoke it at any time, which deletes the replica.` : "No voice will be created. You can close this page."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card p-7">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-lavender text-purple"><ShieldCheck size={22} /></span>
        <h1 className="mt-4 text-2xl font-extrabold">{consent.orgName} is asking to use your voice</h1>
        <p className="mt-2 text-body">
          This request is for <span className="font-semibold text-navy">{consent.ownerName}</span> ({consent.ownerEmail}). An AI replica of your voice will only be created if you verify your email, sign and record the statement below.
          {consent.commercialUse ? " The request includes commercial use." : " The request is for non commercial use only."}
        </p>
      </div>
      {error && <FormMessage kind="error">{error}</FormMessage>}

      <div className="card p-7">
        <h2 className="text-lg font-bold">Step 1: Verify your email</h2>
        {sessionEmail === undefined ? <Loader2 className="ld-spin mt-3 text-muted" /> : verified ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-success"><CheckCircle2 size={16} /> Verified as {consent.ownerEmail}</p>
        ) : (
          <div className="mt-3 space-y-3">
            {sessionEmail && <p className="text-sm text-muted">You are signed in as {sessionEmail}, which is not the invited address.</p>}
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={sendLink}><Mail size={14} /> {sent ? "Send again" : `Email a link to ${consent.ownerEmail}`}</button>
            {sent && (
              <div>
                <p className="text-sm text-muted">Open the link in the email, or enter the code from it here.</p>
                <div className="mt-2 flex gap-2">
                  <input aria-label="Verification code" className="input max-w-[180px]" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" inputMode="numeric" />
                  <button type="button" className="btn btn-outline btn-sm" disabled={busy || code.length < 6} onClick={verifyCode}>Verify</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <fieldset disabled={!verified} className="card space-y-5 p-7 disabled:opacity-50">
        <h2 className="text-lg font-bold">Step 2: Read and record the statement</h2>
        <blockquote className="rounded-xl bg-canvas p-4 text-[0.9375rem] leading-relaxed text-navy">{consent.statement}</blockquote>
        <div className="flex flex-wrap items-center gap-2">
          {!isRecording ? (
            <button type="button" className="btn btn-dark btn-sm" onClick={startRec}><Mic size={14} /> {recording ? "Record again" : "Start recording"}</button>
          ) : (
            <button type="button" className="btn btn-sm bg-coral text-white" onClick={stopRec}><Square size={14} /> Stop recording</button>
          )}
          <label className="btn btn-outline btn-sm cursor-pointer"><UploadCloud size={14} /> Upload a recording
            <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setRecording(f); }} />
          </label>
          {recording && !isRecording && <audio controls src={URL.createObjectURL(recording)} className="h-9" />}
        </div>
        <h2 className="pt-2 text-lg font-bold">Step 3: Sign</h2>
        <div>
          <label htmlFor="sig" className="label">Type your full name: {consent.ownerName}</label>
          <input id="sig" className="input" value={signature} onChange={(e) => setSignature(e.target.value)} autoComplete="name" />
        </div>
        <label className="flex gap-2.5 text-sm"><input type="checkbox" checked={c1} onChange={(e) => setC1(e.target.checked)} className="mt-1" /> I am {consent.ownerName} and the voice in the recordings that will be provided is mine.</label>
        <label className="flex gap-2.5 text-sm"><input type="checkbox" checked={c2} onChange={(e) => setC2(e.target.checked)} className="mt-1" /> I agree to the use described in the statement and understand I can revoke it.</label>
        <div className="flex flex-wrap justify-between gap-2">
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => submit("decline")}>Decline request</button>
          <button type="button" className="btn btn-primary" disabled={busy || !recording || !c1 || !c2 || !signature} onClick={() => submit("accept")}>
            {busy && <Loader2 size={14} className="ld-spin" />} Give consent
          </button>
        </div>
      </fieldset>
    </div>
  );
}
