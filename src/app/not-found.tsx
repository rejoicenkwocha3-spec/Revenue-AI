import Link from "next/link";
import TrueAuthorLogo from "@/components/TrueAuthorLogo";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#F5F8FC", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <div style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <TrueAuthorLogo size={48} />
        </div>
        <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "5rem", color: "#D1DCF0", lineHeight: 1, margin: "0 0 0.5rem" }}>404</h1>
        <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.5rem", color: "#102A43", margin: "0 0 0.75rem" }}>Page not found</h2>
        <p style={{ color: "#64748B", fontSize: "1rem", lineHeight: 1.7, margin: "0 0 2rem" }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" className="btn-primary" style={{ display: "inline-flex" }}>Go to Homepage</Link>
      </div>
    </div>
  );
}
