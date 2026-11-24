import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { opportunitySchema } from "@/lib/schemas";
import { clean, dbError } from "@/lib/crud";
import { audit } from "@/lib/audit";
import { assertOpportunityCapacity } from "@/lib/billing";
import { can } from "@/lib/permissions";

export const POST = handle(async (req: Request) => {
  const ctx = await requireUser("crm.write");
  const body = clean(await parseBody(req, opportunitySchema));
  // Representatives create deals they own; managers can assign any owner.
  const owner = can(ctx.role, "deal.manage_any") ? body.owner_id ?? ctx.userId : ctx.userId;
  if (!can(ctx.role, "deal.manage_any") && body.owner_id && body.owner_id !== ctx.userId) throw new ApiError(403, "Sales representatives can only create opportunities they own.");
  await assertOpportunityCapacity(ctx.orgId);
  const supabase = await createClient();
  const { data, error } = await supabase.from("opportunities").insert({ ...body, owner_id: owner, org_id: ctx.orgId, created_by: ctx.userId }).select("*").single();
  dbError(error, "opportunity");
  await audit({ orgId: ctx.orgId, userId: ctx.userId, action: "opportunity.created", entityType: "opportunities", entityId: data.id, details: { name: data.name, amount: data.amount } });
  return json(data, 201);
});
