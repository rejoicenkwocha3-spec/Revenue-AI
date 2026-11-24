import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6 text-center">
      <Logo />
      <p className="mt-10 font-mono text-sm text-muted">404</p>
      <h1 className="mt-2 text-3xl font-extrabold">This page does not exist</h1>
      <p className="mt-2 text-muted">The link may be broken or the page may have moved.</p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className="btn btn-primary">Go home</Link>
        <Link href="/dashboard" className="btn btn-outline">Open dashboard</Link>
      </div>
    </div>
  );
}
