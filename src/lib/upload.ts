"use client";

/** PUTs a file to a Supabase signed upload URL, reporting progress. */
export function uploadToSignedUrl(signedUrl: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "false");
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anon) xhr.setRequestHeader("apikey", anon);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        let msg = `Upload failed (${xhr.status})`;
        try {
          const j = JSON.parse(xhr.responseText);
          msg = j.message || j.error || msg;
        } catch {}
        if (xhr.status === 413) msg = "The file is larger than your storage bucket allows. Raise the file size limit in Supabase Storage settings.";
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload. Check your connection and try again."));
    xhr.send(file);
  });
}

/** Reads duration and dimensions locally so quotas can be checked before processing. */
export function readMediaMetadata(file: File): Promise<{ duration: number | null; width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement(file.type.startsWith("video") ? "video" : "audio") as HTMLVideoElement;
    el.preload = "metadata";
    const done = (d: { duration: number | null; width: number | null; height: number | null }) => {
      URL.revokeObjectURL(url);
      resolve(d);
    };
    el.onloadedmetadata = () =>
      done({
        duration: Number.isFinite(el.duration) ? el.duration : null,
        width: "videoWidth" in el && el.videoWidth ? el.videoWidth : null,
        height: "videoHeight" in el && el.videoHeight ? el.videoHeight : null,
      });
    el.onerror = () => done({ duration: null, width: null, height: null });
    setTimeout(() => done({ duration: null, width: null, height: null }), 8000);
    el.src = url;
  });
}

export async function uploadProjectMedia(projectId: string, file: File, onProgress: (pct: number) => void) {
  const meta = await readMediaMetadata(file);
  const prep = await fetch("/api/media/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ projectId, fileName: file.name, mimeType: normaliseMime(file), sizeBytes: file.size }),
  });
  const p = await prep.json();
  if (!prep.ok) throw new Error(p.error ?? "Could not prepare upload.");
  await uploadToSignedUrl(p.signedUrl, file, onProgress);
  const done = await fetch("/api/media/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ projectId, path: p.path, fileName: file.name, mimeType: normaliseMime(file), durationSeconds: meta.duration, width: meta.width, height: meta.height }),
  });
  const d = await done.json();
  if (!done.ok) throw new Error(d.error ?? "Could not register the upload.");
  return d as { id: string; kind: string };
}

export function normaliseMime(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ({ mkv: "video/x-matroska", m4a: "audio/x-m4a", flac: "audio/flac", mp3: "audio/mpeg", wav: "audio/wav", mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm" } as Record<string, string>)[ext ?? ""] ?? "application/octet-stream";
}
