"use client";

export class ClientApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

/** JSON fetch helper for the app's API routes with readable error messages. */
export async function api<T = unknown>(url: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: init.body ? { "content-type": "application/json" } : undefined,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ClientApiError((data as { error?: string }).error ?? `Request failed (${res.status})`, res.status, (data as { code?: string }).code);
  return data as T;
}

export async function openSigned(bucket: string, path: string, download = false) {
  const { url } = await api<{ url: string }>(`/api/files/sign?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}${download ? "&download=1" : ""}`);
  return url;
}
