import Link from "next/link";
import { ArrowRight, Eye, Brain, TrendingUp, ScanSearch, KanbanSquare, Sparkles, BarChart3, Zap, HeartHandshake, Building2, Rocket, Landmark, Briefcase } from "lucide-react";
import { ProductDemo } from "@/components/marketing/ProductDemo";
import { Section, SectionHead, FeatureCard, CtaBand } from "@/components/marketing/Sections";
import { PricingCards } from "@/components/marketing/PricingCards";

export const metadata = { title: { absolute: "Revenue AI: Turn Revenue Data Into Predictable Growth" } };

const PILLARS = [
  { icon: Eye, title: "Visibility", body: "Understand exactly what is happening across your sales pipeline: every deal, stage, owner and close date in one view." },
  { icon: Brain, title: "Intelligence", body: "Use AI to identify risks, predict outcomes and uncover opportunities, with the evidence behind every finding." },
  { icon: TrendingUp, title: "Growth", body: "Help revenue teams make better decisions, close more deals and achieve their targets quarter after quarter." },
];

function Split({ eyebrow, title, body, points, visual, flip = false }: { eyebrow: string; title: string; body: string; points: string[]; visual: React.ReactNode; flip?: boolean }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={flip ? "lg:order-2" : ""}>
        <SectionHead eyebrow={eyebrow} title={title} body={body} />
        <ul className="mt-6 space-y-2.5">{points.map((p) => <li key={p} className="flex gap-3 text-ink"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />{p}</li>)}</ul>
      </div>
      <div className={flip ? "lg:order-1" : ""}>{visual}</div>
    </div>
  );
}

function MiniPanel({ title, rows }: { title: string; rows: [string, string, string?][] }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-lift)]">
      <p className="text-sm font-bold text-ink">{title}</p>
      <ul className="mt-3 divide-y divide-line text-sm">
        {rows.map(([a, b, c]) => <li key={a} className="flex items-center justify-between gap-3 py-2.5"><span className="text-body">{a}</span><span className="flex items-center gap-2 font-semibold tabular-nums text-ink">{b}{c && <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-muted">{c}</span>}</span></li>)}
      </ul>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-canvas">
        <div className="container-ra grid gap-12 py-16 md:py-20 lg:grid-cols-[1fr_1.25fr] lg:items-center">
          <div className="ra-fade-up">
            <p className="eyebrow">Know Your Numbers. Predict Your Growth.</p>
            <h1 className="mt-4 text-[2.6rem] font-extrabold leading-[1.05] md:text-[3.5rem]">Turn Revenue Data Into Predictable Growth.</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-body">Revenue AI gives businesses a clearer view of their sales pipeline, smarter revenue forecasts and actionable AI insights to help teams identify opportunities, reduce deal risks and grow revenue with confidence.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary">Get Started <ArrowRight size={16} /></Link>
              <Link href="/platform" className="btn btn-outline">Explore Platform</Link>
            </div>
            <p className="mt-5 text-sm text-muted">Connects with Salesforce, HubSpot, Pipedrive, Google Workspace, Outlook and Slack.</p>
          </div>
          <ProductDemo />
        </div>
      </section>

      <Section>
        <SectionHead center eyebrow="Revenue intelligence for modern businesses" title="One intelligent environment for your entire revenue operation" body="Stop stitching together spreadsheets, disconnected CRM records and manual sales reports. Revenue AI connects sales activity, customer interactions, pipeline and performance so every decision starts from the same numbers." />
        <div className="mt-12 grid gap-5 md:grid-cols-3">{PILLARS.map((p) => <FeatureCard key={p.title} {...p} />)}</div>
      </Section>

      <Section tone="canvas">
        <Split eyebrow="Predictable revenue forecasting" title="Forecasts that show their working" body="Revenue AI combines booked revenue, commit and best case deals and your own historical conversion to project the quarter. Every forecast shows a worst, expected and best case with the assumptions behind it." points={["Monthly, quarterly and annual forecasts", "Forecast snapshots, change review and accuracy history", "Clear labels that separate actual results from projections"]}
          visual={<MiniPanel title="Q3 forecast" rows={[["Closed won", "$1.42M", "Actual"], ["Commit", "$380K"], ["Best case", "$520K"], ["Expected case", "$1.74M", "Projection"], ["Range", "$1.61M to $1.88M", "Projection"]]} />} />
      </Section>

      <Section>
        <Split flip eyebrow="AI powered deal intelligence" title="Know which deals need attention before they slip" body="Every open deal is scored from logged activity, stakeholder coverage, stage timing, close date changes, objections and competitor mentions. Missing information is flagged separately, so gaps are never mistaken for facts." points={["Deal health and engagement scores with evidence", "Specific next best actions for each deal", "Manager review and comments in one place"]}
          visual={<MiniPanel title="Deals needing attention" rows={[["Store performance analytics", "Health 38", "At risk"], ["Risk reporting platform", "Health 52", "Watch"], ["Claims insight workspace", "Health 64", "Watch"], ["Plant productivity suite", "Health 86", "Healthy"]]} />} />
      </Section>

      <Section tone="canvas">
        <SectionHead center eyebrow="Complete pipeline visibility" title="Everything your revenue team needs, connected" />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={KanbanSquare} title="Complete pipeline visibility" body="A drag and drop Kanban board and a detailed table with search, filters, sorting, ownership, values and close dates." />
          <FeatureCard icon={Sparkles} title="Automated sales insights" body="Six specialised AI agents review deals, forecasts, pipeline, productivity and customers, and propose actions for approval." />
          <FeatureCard icon={BarChart3} title="Revenue performance analytics" body="Total revenue, MRR, ARR, new, expansion and churned revenue, win rate, deal size and sales cycle with date filters." />
          <FeatureCard icon={Zap} title="Sales productivity" body="Daily priorities for every representative: overdue tasks, quiet deals, deals closing soon and renewals due." />
          <FeatureCard icon={HeartHandshake} title="Customer retention and expansion" body="Customer health, churn risk, renewal tracking and expansion signals from real revenue and engagement history." />
          <FeatureCard icon={ScanSearch} title="Deal inspection" body="A dedicated workspace for each opportunity with stakeholders, activities, risks, missing information and recommendations." />
        </div>
      </Section>

      <Section>
        <SectionHead center eyebrow="Industry solutions" title="Built for the way your business sells" body="From first funded startup to global enterprise, Revenue AI adapts to your pipeline stages, territories, teams and fiscal calendar." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard icon={Rocket} title="SaaS businesses" body="Track ARR, expansion and churn alongside new business pipeline." />
          <FeatureCard icon={Building2} title="Enterprise organisations" body="Teams, territories, seven roles and a complete audit trail." />
          <FeatureCard icon={Briefcase} title="Startups" body="Replace spreadsheets with a real pipeline and an honest forecast." />
          <FeatureCard icon={Landmark} title="Sales organisations" body="Quotas, coaching signals and performance across every team." />
        </div>
        <div className="mt-8 text-center"><Link href="/solutions" className="btn btn-outline">View solutions <ArrowRight size={16} /></Link></div>
      </Section>

      <Section tone="canvas">
        <SectionHead center eyebrow="Pricing" title="Simple plans that grow with your team" body="Every plan includes the pipeline, deal health scoring and the AI Sales Assistant." />
        <div className="mt-12"><PricingCards compact /></div>
        <div className="mt-8 text-center"><Link href="/pricing" className="font-semibold text-blue">Compare plans in detail</Link></div>
      </Section>

      <CtaBand />
    </>
  );
}
