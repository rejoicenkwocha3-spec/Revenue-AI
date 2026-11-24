import { z } from "zod";
import { handle, json, parseBody, requireUser } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { assertId, dbError } from "@/lib/crud";

const schema = z.object({ contact_id: z.string().uuid(), role: z.string().trim().max(80).nullable().optional() });

export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  assertId(id);
  const ctx = await requireUser("crm.write");
  const b = await parseBody(req, schema);
  const supabase = await createClient();
  const { error } = await supabase.from("opportunity_contacts").upsert({ opportunity_id: id, contact_id: b.contact_id, org_id: ctx.orgId, role: b.role ?? null }, { onConflict: "opportunity_id,contact_id" });
  dbError(error, "stakeholder");
  return json({ ok: true }, 201);
});

export const DELETE = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  assertId(id);
  const ctx = await requireUser("crm.write");
  const contact = new URL(req.url).searchParams.get("contact_id") ?? "";
  assertId(contact);
  const supabase = await createClient();
  const { error } = await supabase.from("opportunity_contacts").delete().eq("opportunity_id", id).eq("contact_id", contact).eq("org_id", ctx.orgId);
  dbError(error, "stakeholder");
  return json({ ok: true });
});
