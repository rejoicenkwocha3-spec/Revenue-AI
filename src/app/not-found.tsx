import Link from "next/link";
import SearchSproutLogo from "@/components/SearchSproutLogo";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#F7FAF8", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <div>
        <SearchSproutLogo size={56} className="mx-auto mb-6" />
        <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "5rem", color: "#063B38", lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem", marginTop: "0.5rem" }}>Page not found</h1>
        <p style={{ color: "#65736D", marginBottom: "2rem", fontSize: "1rem" }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#16C653", color: "#FFFFFF", padding: "0.75rem 1.75rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: 600 }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
