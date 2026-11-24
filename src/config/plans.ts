/**
 * Subscription plans.
 *
 * Checkout links are connected in the exact order supplied: card 1 uses the first
 * Selar link, card 2 the second and card 3 the third.
 *
 * Plan names, prices and billing frequency (Starter $47, Growth $57, Scale $97, monthly)
 * were confirmed by the Revenue AI owner because the Selar pages could not be read from
 * the build environment. The seats and usage limits below are product settings proposed
 * for Revenue AI and enforced by the backend: edit them here to match what you sell.
 * Every page and every limit reads from this file.
 */
export type PlanId = "plan_47" | "plan_57" | "plan_97";
export type AgentKey = "deal_inspection" | "forecasting" | "sales_productivity" | "pipeline_analysis" | "customer_retention" | "revenue_insights";

export interface Plan {
  id: PlanId;
  /** Selar product slug, used to match payment notifications to a plan. */
  selarSlug: string;
  checkoutUrl: string;
  name: string;
  priceUsd: number;
  billing: "month" | "year";
  billingLabel: string;
  summary: string;
  seats: number;
  /** null means no limit */
  maxOpportunities: number | null;
  aiQueriesPerMonth: number;
  agents: AgentKey[];
  maxIntegrations: number | null;
  forecasting: string;
  reporting: string[];
  aiFeatures: string[];
  features: string[];
  highlighted?: boolean;
}

const ALL_AGENTS: AgentKey[] = ["deal_inspection", "forecasting", "sales_productivity", "pipeline_analysis", "customer_retention", "revenue_insights"];

export const PLANS: Plan[] = [
  {
    id: "plan_47",
    selarSlug: "47plan",
    checkoutUrl: "https://selar.com/47plan?currency=USD",
    name: "Starter",
    priceUsd: 47,
    billing: "month",
    billingLabel: "per month",
    summary: "For founders and small sales teams replacing spreadsheets with a real pipeline.",
    seats: 3,
    maxOpportunities: 500,
    aiQueriesPerMonth: 200,
    agents: ["deal_inspection", "sales_productivity"],
    maxIntegrations: 2,
    forecasting: "Monthly and quarterly forecasts",
    reporting: ["Overview dashboard", "Pipeline and win rate reports", "CSV export"],
    aiFeatures: ["AI Sales Assistant", "Deal health scores", "Deal Inspection and Sales Productivity agents"],
    features: ["Kanban and table pipeline", "Accounts, contacts and activities", "Tasks and follow up reminders"],
  },
  {
    id: "plan_57",
    selarSlug: "57plan",
    checkoutUrl: "https://selar.com/57plan?currency=USD",
    name: "Growth",
    priceUsd: 57,
    billing: "month",
    billingLabel: "per month",
    summary: "For growing revenue teams that forecast, inspect deals and coach every week.",
    seats: 10,
    maxOpportunities: 5000,
    aiQueriesPerMonth: 1000,
    agents: ALL_AGENTS,
    maxIntegrations: 5,
    forecasting: "Monthly, quarterly and annual forecasts with scenarios",
    reporting: ["Everything in Starter", "Revenue analytics by rep, region and product", "Team performance and quotas"],
    aiFeatures: ["Everything in Starter", "All six AI revenue agents", "Forecast explanations and pipeline analysis"],
    features: ["Everything in Starter", "Deal inspection with manager comments", "Customer health and renewals", "Teams and territories"],
    highlighted: true,
  },
  {
    id: "plan_97",
    selarSlug: "97plan",
    checkoutUrl: "https://selar.com/97plan?currency=USD",
    name: "Scale",
    priceUsd: 97,
    billing: "month",
    billingLabel: "per month",
    summary: "For revenue organisations running multiple teams, territories and systems.",
    seats: 25,
    maxOpportunities: null,
    aiQueriesPerMonth: 5000,
    agents: ALL_AGENTS,
    maxIntegrations: null,
    forecasting: "All forecast periods, scenarios and accuracy tracking",
    reporting: ["Everything in Growth", "Forecast accuracy history", "Audit log and BI data access"],
    aiFeatures: ["Everything in Growth", "Highest AI usage allowance", "Agent auto task creation"],
    features: ["Everything in Growth", "Unlimited opportunities", "Unlimited integrations", "Seven role permission model"],
  },
];

/** Limits for organisations without a verified subscription. */
export const FREE_LIMITS = {
  name: "Free",
  seats: 1,
  maxOpportunities: 50,
  aiQueriesPerMonth: 20,
  agents: ["deal_inspection"] as AgentKey[],
  maxIntegrations: 0,
};

export function getPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function planFromSelarText(text: string): Plan | undefined {
  const lower = text.toLowerCase();
  return PLANS.find((p) => lower.includes(p.selarSlug));
}
