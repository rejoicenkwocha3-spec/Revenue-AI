import type { OrgData } from "@/lib/revenue/types";
import type { DealHealth } from "@/lib/revenue/dealHealth";
import { accountName, dealProbability, memberName, stageMap } from "@/lib/revenue/metrics";
import { isoDate } from "@/lib/revenue/periods";
import { can, type Role } from "@/lib/permissions";

export function opportunityRows(d: OrgData, health: Map<string, DealHealth>, me: { userId: string; role: Role }) {
  const stages = stageMap(d);
  const today = isoDate(d.now);
  return d.opportunities.map((o) => ({
    id: o.id, name: o.name, account: accountName(d, o.account_id), owner: memberName(d, o.owner_id), ownerId: o.owner_id,
    stage: stages.get(o.stage_id ?? "")?.name ?? "Not set", stageId: o.stage_id, status: o.status, amount: o.amount, probability: dealProbability(d, o),
    closeDate: o.close_date, category: o.forecast_category, health: health.get(o.id)?.health ?? null, score: health.get(o.id)?.score ?? null,
    lastActivity: o.last_activity_at?.slice(0, 10) ?? null, overdue: o.status === "open" && !!o.close_date && o.close_date < today,
    canEdit: can(me.role, "deal.manage_any") || (me.role === "sales_rep" && (!o.owner_id || o.owner_id === me.userId)),
  }));
}
