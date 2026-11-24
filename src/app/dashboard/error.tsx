"use client";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <AlertTriangle className="mx-auto text-danger" size={32} />
      <h1 className="mt-4 text-2xl font-extrabold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">{error.message || "An unexpected error occurred while loading this page."}</p>
      {error.digest && <p className="mt-1 font-mono text-xs text-muted">Reference {error.digest}</p>}
      <button type="button" className="btn btn-primary mt-6" onClick={reset}>Try again</button>
    </div>
  );
}
