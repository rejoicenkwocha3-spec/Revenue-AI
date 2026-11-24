"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { VoiceBrowser, loadVoices, type VoicesResponse } from "../projects/[id]/VoicePicker";

export function VoiceLibraryClient() {
  const [data, setData] = useState<VoicesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadVoices(true).then(setData).catch((e) => setError(e.message));
  }, []);
  return (
    <div className="card p-5">
      {error && <p className="text-sm text-danger">{error}</p>}
      {!data && !error && <p className="flex items-center gap-2 text-sm text-muted"><Loader2 size={16} className="ld-spin" /> Loading voices</p>}
      {data && <VoiceBrowser data={data} language={null} />}
    </div>
  );
}
