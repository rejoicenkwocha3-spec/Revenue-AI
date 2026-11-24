import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero, Section, CtaBand } from "@/components/marketing/Sections";

export const metadata = { title: "Solutions" };

const SOLUTIONS = [
  { id: "sales-teams", title: "Sales Teams", challenge: "Representatives lose time updating spreadsheets and chasing the wrong deals.", solves: ["A Kanban pipeline that updates forecasts as deals move", "Daily priorities from the Sales Productivity Agent", "Deal health that flags quiet and stalled deals early"] },
  { id: "revops", title: "Revenue Operations", challenge: "Data lives in several systems and every report needs manual reconciliation.", solves: ["CRM, calendar and Slack integrations with sync history and data mapping", "Configurable stages, probabilities and fiscal calendars", "Audit trail and role based access across the organisation"] },
  { id: "cro", title: "Chief Revenue Officers", challenge: "Board forecasts depend on gut feel and late surprises.", solves: ["Worst, expected and best case forecasts with stated assumptions", "Forecast snapshots, change review and accuracy history", "Revenue intelligence across teams, regions and products"] },
  { id: "managers", title: "Sales Managers", challenge: "Pipeline reviews take hours and coaching lacks evidence.", solves: ["Deal inspection with risks and missing information", "Manager comments and follow up task assignment", "Team performance and quota attainment side by side"] },
  { id: "bdr", title: "Business Development Teams", challenge: "Prospecting effort is hard to measure and prioritise.", solves: ["Account prioritisation by value, priority and engagement", "Activity and meeting tracking per representative", "Opportunities created and conversion by stage"] },
  { id: "cs", title: "Customer Success Teams", challenge: "Renewal risks surface too late to act on.", solves: ["Customer health from revenue and engagement", "Renewal tracking with reminders", "Expansion opportunities from the Customer Retention Agent"] },
  { id: "saas", title: "SaaS Businesses", challenge: "Recurring revenue metrics are scattered across finance and sales tools.", solves: ["MRR, ARR, new, expansion and churned revenue", "Net new ARR by month", "Renewal and expansion pipeline in one view"] },
  { id: "enterprise", title: "Enterprise Organisations", challenge: "Many teams, territories and systems make one view of revenue difficult.", solves: ["Teams, territories and seven roles", "Organisation level data isolation", "BI metrics API for Power BI, Looker or Tableau"] },
  { id: "startups", title: "Startups", challenge: "Early teams need discipline without enterprise complexity.", solves: ["Set up in minutes with a default pipeline", "An honest forecast that explains its confidence", "Plans that start small and grow with you"] },
  { id: "marketing", title: "Marketing Teams", challenge: "Marketing cannot see which sources turn into revenue.", solves: ["Lead source on every opportunity", "Pipeline created trends over time", "Revenue by product and region"] },
];

export default function SolutionsPage() {
  return (
    <>
      <PageHero eyebrow="Solutions" title="Revenue AI for every team that drives revenue" body="Each team faces a different revenue problem. Revenue AI gives each one the view and the actions it needs, from the same trusted data.">
        <nav aria-label="Solutions" className="mt-8 flex flex-wrap gap-2">{SOLUTIONS.map((s) => <Link key={s.id} href={`#${s.id}`} className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink hover:border-blue hover:text-blue">{s.title}</Link>)}</nav>
      </PageHero>
      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {SOLUTIONS.map((s) => (
            <article id={s.id} key={s.id} className="scroll-mt-24 rounded-2xl border border-line bg-white p-7 shadow-[var(--shadow-card)]">
              <h2 className="text-2xl font-extrabold">{s.title}</h2>
              <p className="mt-3 text-sm"><span className="font-semibold text-ink">The challenge:</span> <span className="text-body">{s.challenge}</span></p>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">How Revenue AI helps</p>
              <ul className="mt-2 space-y-2">{s.solves.map((x) => <li key={x} className="flex gap-2.5 text-sm text-ink"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />{x}</li>)}</ul>
              <Link href="/signup" className="btn btn-outline btn-sm mt-6 whitespace-normal text-left">Get started for {s.title} <ArrowRight size={14} /></Link>
            </article>
          ))}
        </div>
      </Section>
      <CtaBand />
    </>
  );
}
