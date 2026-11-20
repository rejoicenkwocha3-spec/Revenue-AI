import Link from "next/link";
import { CreditCard, ArrowRight, CheckCircle2 } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$47/mo",
    href: "https://selar.com/47plan?currency=USD",
    features: ["50K queries/month", "100K records", "3 projects", "API access"],
  },
  {
    name: "Growth",
    price: "$57/mo",
    href: "https://selar.com/57plan?currency=USD",
    features: ["500K queries/month", "1M records", "10 projects", "AI personalisation"],
    featured: true,
  },
  {
    name: "Scale",
    price: "$97/mo",
    href: "https://selar.com/97plan?currency=USD",
    features: ["Unlimited queries", "Unlimited records", "Unlimited projects", "99.9% SLA"],
  },
];

export default function BillingPage() {
  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#071F20", margin: "0 0 0.25rem" }}>Billing</h1>
        <p style={{ color: "#65736D", fontSize: "0.9375rem", margin: 0 }}>Manage your subscription and payment details.</p>
      </div>

      {/* Current plan */}
      <div className="card-ss" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.8125rem", color: "#65736D", marginBottom: "0.25rem" }}>Current Plan</div>
            <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.5rem", color: "#071F20" }}>Free Trial</div>
            <div style={{ color: "#65736D", fontSize: "0.875rem", marginTop: "0.25rem" }}>14-day trial. No credit card required.</div>
          </div>
          <Link href="/pricing" className="btn-primary">
            Upgrade Plan <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Plan cards */}
      <h2 style={{ fontSize: "1.125rem", marginBottom: "1.25rem" }}>Available Plans</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        {plans.map((p) => (
          <div key={p.name} style={{
            background: p.featured ? "#063B38" : "#FFFFFF",
            border: `1px solid ${p.featured ? "#16C653" : "#DCE8E2"}`,
            borderRadius: "0.875rem",
            padding: "1.5rem",
          }}>
            <div style={{ fontWeight: 700, color: p.featured ? "#16C653" : "#063B38", marginBottom: "0.25rem" }}>{p.name}</div>
            <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.75rem", color: p.featured ? "#FFFFFF" : "#071F20", marginBottom: "1.25rem" }}>{p.price}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {p.features.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: p.featured ? "rgba(255,255,255,0.85)" : "#071F20" }}>
                  <CheckCircle2 size={14} color="#16C653" />
                  {f}
                </li>
              ))}
            </ul>
            <a href={p.href} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", padding: "0.625rem 1rem", background: p.featured ? "#16C653" : "#071F20", color: "#FFFFFF", borderRadius: "0.5rem", textDecoration: "none", fontWeight: 600, fontSize: "0.875rem" }}>
              Select Plan <ArrowRight size={14} />
            </a>
          </div>
        ))}
      </div>

      {/* Payment method placeholder */}
      <div className="card-ss">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <CreditCard size={20} color="#65736D" />
          <h2 style={{ fontSize: "1rem", margin: 0 }}>Payment Method</h2>
        </div>
        <p style={{ color: "#65736D", fontSize: "0.9375rem", margin: 0 }}>
          Payment is processed securely through Selar. After upgrading, your subscription is managed via your Selar account.
        </p>
      </div>
    </div>
  );
}
