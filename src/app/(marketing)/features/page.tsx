import Link from "next/link";
import { Brain, TrendingUp, KanbanSquare, ScanSearch, FileSearch, BarChart3, Trophy, MessageSquareText, HeartHandshake, Send, Bot } from "lucide-react";
import { PageHero, Section, CtaBand } from "@/components/marketing/Sections";
import { ProductDemo } from "@/components/marketing/ProductDemo";

export const metadata = { title: "Features" };

const FEATURES = [
  { id: "intelligence", icon: Brain, title: "AI Revenue Intelligence", body: "Analyses your revenue data and identifies meaningful patterns.", points: ["Revenue performance against prior periods", "Pipeline movement and stage changes", "Sales trends and conversion rates", "Deal risks and revenue opportunities", "Team performance highlights"] },
  { id: "forecasting", icon: TrendingUp, title: "Predictive Revenue Forecasting", body: "An intelligent forecasting system that explains its assumptions and uncertainty.", points: ["Monthly, quarterly and annual forecasts", "Worst, expected and best case scenarios", "Forecast versus actual and historical accuracy", "Expected revenue and potential shortfalls", "Forecast snapshots and change review"] },
  { id: "pipeline", icon: KanbanSquare, title: "Sales Pipeline Management", body: "A complete visual pipeline with a Kanban board and a detailed table view.", points: ["Create and edit opportunities", "Assign representatives and move deals between stages", "Close dates, values and probabilities", "Pipeline health and stalled opportunity detection", "Pipeline conversion rates"] },
  { id: "deal-intelligence", icon: ScanSearch, title: "AI Deal Intelligence", body: "Evaluates every opportunity from the information available and recommends how to improve the outcome.", points: ["Engagement and stakeholder involvement", "Deal progression and activity history", "Meeting outcomes, objections and competitor mentions", "Budget discussions and expected close dates", "Missing information shown separately from risks"] },
  { id: "inspection", icon: FileSearch, title: "Deal Inspection", body: "A dedicated interface for reviewing each opportunity in depth.", points: ["Opportunity details, value, stage and account", "Buyer stakeholders and recent activities", "Deal risks, next steps and AI recommendations", "Manager review comments", "Follow up task assignment"] },
  { id: "analytics", icon: BarChart3, title: "Revenue Analytics", body: "An analytics dashboard with interactive charts and date filters.", points: ["Total revenue, MRR and ARR", "New, expansion and churned revenue", "Pipeline value, win rate, deal size and cycle length", "Revenue by representative, region and product", "CSV exports for every report"] },
  { id: "performance", icon: Trophy, title: "Sales Performance", body: "Individual and team performance in one comparison.", points: ["Quota attainment", "Deals won and lost", "Meetings booked and opportunities created", "Conversion rates and revenue generated", "Sales activity and performance trends"] },
  { id: "assistant", icon: MessageSquareText, title: "AI Sales Assistant", body: "Ask questions in plain English and get answers grounded in your organisation's actual revenue data.", points: ["How much revenue are we likely to generate this quarter?", "Which opportunities are at risk?", "Which deals have been inactive?", "What should our team prioritise today?", "Are we on track to hit our revenue target?"] },
  { id: "retention", icon: HeartHandshake, title: "Customer Retention and Expansion", body: "Customer account management that protects and grows recurring revenue.", points: ["Customer health monitoring", "Renewal tracking and reminders", "Churn risk identification", "Upsell and expansion opportunities", "Customer interaction history"] },
  { id: "engagement", icon: Send, title: "Sales Engagement", body: "Tools for managing daily selling activity.", points: ["Task management and follow up reminders", "Email templates", "Meeting tracking", "Prospect management and account prioritisation", "Sales activity history"] },
  { id: "agents", icon: Bot, title: "AI Revenue Agents", body: "Specialised agents that work with appropriate permissions and explain the evidence for every recommendation.", points: ["Deal Inspection Agent: missing information, stalled deals and risks", "Forecasting Agent: projections from history and pipeline", "Sales Productivity Agent: the most important tasks for each representative", "Pipeline Analysis Agent: bottlenecks and conversion problems", "Customer Retention Agent: renewal risks and expansion", "Revenue Insights Agent: answers using organisational data"] },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero eyebrow="Features" title="The complete Revenue AI feature catalogue" body="Everything a revenue team needs to see the pipeline clearly, forecast honestly and act on the right deals.">
        <nav aria-label="Features" className="mt-8 flex flex-wrap gap-2">{FEATURES.map((f) => <Link key={f.id} href={`#${f.id}`} className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink hover:border-blue hover:text-blue">{f.title}</Link>)}</nav>
      </PageHero>
      <Section><ProductDemo /></Section>
      <Section tone="canvas">
        <div className="space-y-5">
          {FEATURES.map((f) => (
            <article id={f.id} key={f.id} className="grid scroll-mt-24 gap-6 rounded-2xl border border-line bg-white p-7 shadow-[var(--shadow-card)] md:grid-cols-[1fr_1.2fr]">
              <div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue"><f.icon size={20} /></span>
                <h2 className="mt-4 text-2xl font-extrabold">{f.title}</h2>
                <p className="mt-2 text-body">{f.body}</p>
              </div>
              <ul className="grid content-start gap-2.5 sm:grid-cols-2">{f.points.map((p) => <li key={p} className="flex gap-2.5 rounded-xl bg-canvas px-3.5 py-3 text-sm text-ink"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />{p}</li>)}</ul>
            </article>
          ))}
        </div>
      </Section>
      <CtaBand />
    </>
  );
}
