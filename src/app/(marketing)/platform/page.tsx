import { Database, Brain, KanbanSquare, TrendingUp, ScanSearch, Send, Mic, BarChart3, HeartHandshake, Bot, Workflow, Users, ArrowRight } from "lucide-react";
import { PageHero, Section, SectionHead, FeatureCard, CtaBand } from "@/components/marketing/Sections";

export const metadata = { title: "Platform" };

const FLOW = [
  ["Capture Revenue Data", "Deals, accounts, contacts, activities and meetings flow in from your CRM, calendar and team."],
  ["Understand Performance", "Bookings, ARR, win rate, cycle length and quota attainment are calculated from those records."],
  ["Identify Opportunities", "Expansion signals, best case deals and high priority accounts surface automatically."],
  ["Predict Outcomes", "Forecasts project the period with a range, a confidence level and stated assumptions."],
  ["Recommend Actions", "AI agents propose tasks, deal updates and follow ups, each with its evidence, for approval."],
  ["Grow Revenue", "Teams act on the right deals first and leaders steer with numbers they trust."],
];

const CAPS = [
  { icon: Database, title: "Revenue Data Management", body: "One record of accounts, contacts, opportunities, activities, meetings, renewals and revenue transactions, isolated per organisation with row level security.", value: "Value: everyone works from the same numbers." },
  { icon: Brain, title: "AI Revenue Intelligence", body: "Patterns across revenue performance, pipeline movement, conversion, deal risk and team performance, each finding linked to the records behind it.", value: "Value: leaders see what changed and why." },
  { icon: KanbanSquare, title: "Pipeline Management", body: "Configurable stages with default probabilities and expected durations, a Kanban board and a detailed table view.", value: "Value: deals move forward with less admin." },
  { icon: TrendingUp, title: "Predictive Forecasting", body: "Worst, expected and best case projections using your historical stage conversion, deal health and forecast categories.", value: "Value: fewer surprises at the end of the quarter." },
  { icon: ScanSearch, title: "Deal Inspection", body: "Deal health, engagement, risk factors and missing information for every opportunity, with manager review comments.", value: "Value: coaching conversations start from evidence." },
  { icon: Send, title: "Sales Engagement", body: "Tasks, follow up reminders, meetings, email templates and account prioritisation for daily selling.", value: "Value: representatives spend time on the right accounts." },
  { icon: Mic, title: "Conversation Intelligence", body: "Log outcomes, objections, competitor mentions and budget discussions from calls and meetings. Signals feed deal health and the agents.", value: "Value: what buyers say shapes the forecast." },
  { icon: BarChart3, title: "Revenue Analytics", body: "MRR, ARR, new, expansion and churned revenue, win rate, deal size and cycle length by representative, region and product.", value: "Value: a clear picture of where revenue comes from." },
  { icon: HeartHandshake, title: "Customer Retention", body: "Customer health, churn risk, renewal tracking and expansion potential from revenue and engagement history.", value: "Value: protect and grow the revenue you already have." },
  { icon: Bot, title: "AI Revenue Agents", body: "Six specialised agents for deal inspection, forecasting, productivity, pipeline analysis, retention and revenue insights.", value: "Value: analysis that used to take hours runs in seconds." },
  { icon: Workflow, title: "Workflow Automation", body: "Agents create follow up tasks automatically when you allow it, while deal changes and emails always wait for approval.", value: "Value: automation with control." },
  { icon: Users, title: "Team Collaboration", body: "Teams, territories, seven roles, deal comments, notifications and a complete audit trail.", value: "Value: the whole revenue team works in one place." },
];

export default function PlatformPage() {
  return (
    <>
      <PageHero eyebrow="The Revenue AI platform" title="Your entire revenue operation, brought together" body="Revenue AI connects revenue data, AI insight and action in one platform: from the first logged call to the forecast you present to the board." />
      <Section>
        <SectionHead center eyebrow="How it works" title="From revenue data to revenue growth" />
        <ol className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {FLOW.map(([t, b], i) => (
            <li key={t} className="relative rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-card)]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-3 text-base font-bold">{t}</h3>
              <p className="mt-1.5 text-sm text-body">{b}</p>
              {i < FLOW.length - 1 && <ArrowRight size={16} className="absolute -right-3 top-8 hidden text-line-strong lg:block" aria-hidden />}
            </li>
          ))}
        </ol>
      </Section>
      <Section tone="canvas">
        <SectionHead eyebrow="Capabilities" title="Twelve capabilities, one source of truth" body="Each capability shares the same records, permissions and audit trail, so insight and action never drift apart." />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CAPS.map((c) => <FeatureCard key={c.title} icon={c.icon} title={c.title} body={c.body} points={[c.value]} />)}
        </div>
      </Section>
      <Section tone="navy">
        <SectionHead dark eyebrow="Trustworthy AI" title="AI that shows its evidence and asks before it acts" body="Agents read data with the permissions of the person who runs them. Every recommendation cites the records it is based on, projections are labelled as projections, deal changes need approval, emails are only drafted, and every action is written to the audit trail." />
      </Section>
      <CtaBand />
    </>
  );
}
