import { z } from "zod";
import { handle, json, parseBody, requireUser } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { assertId, dbError } from "@/lib/crud";
import { notify } from "@/lib/audit";

/** Manager review comments on a deal. The owner is notified. */
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  assertId(id);
  const ctx = await requireUser("deal.comment");
  const { body } = await parseBody(req, z.object({ body: z.string().trim().min(1, "Write a comment").max(4000) }));
  const supabase = await createClient();
  const { data: opp } = await supabase.from("opportunities").select("owner_id, name").eq("id", id).eq("org_id", ctx.orgId).maybeSingle();
  const { data, error } = await supabase.from("deal_comments").insert({ org_id: ctx.orgId, opportunity_id: id, author_id: ctx.userId, body }).select("*").single();
  dbError(error, "comment");
  if (opp?.owner_id && opp.owner_id !== ctx.userId) await notify({ userIds: [opp.owner_id], orgId: ctx.orgId, title: `${ctx.fullName} commented on ${opp.name}`, body: body.slice(0, 140), link: `/dashboard/deals/${id}` });
  return json(data, 201);
});
