import "server-only";
import type { ZodObject, ZodRawShape } from "zod";
import { handle, json, parseBody, requireUser } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { assertAffected, assertId, clean, dbError } from "@/lib/crud";
import { audit } from "@/lib/audit";
import type { Action } from "@/lib/permissions";
import type { AppContext } from "@/lib/session";

interface Opts {
  table: string;
  label: string;
  action: Action;
  schema: ZodObject<ZodRawShape>;
  /** Extra fields set on insert (org_id is always set). */
  insertExtras?: (ctx: AppContext) => Record<string, unknown>;
  before?: (ctx: AppContext, body: Record<string, unknown>) => Promise<void> | void;
  auditCreate?: boolean;
}

/**
 * Collection and item handlers. Writes use the signed in user's Supabase client, so Row Level Security
 * makes the final decision; the role check here gives a clear message first.
 */
export function collection(o: Opts) {
  return {
    POST: handle(async (req: Request) => {
      const ctx = await requireUser(o.action);
      const body = clean(await parseBody(req, o.schema)) as Record<string, unknown>;
      await o.before?.(ctx, body);
      const supabase = await createClient();
      const { data, error } = await supabase.from(o.table).insert({ ...body, org_id: ctx.orgId, ...(o.insertExtras?.(ctx) ?? {}) }).select("*").single();
      dbError(error, o.label);
      if (o.auditCreate) await audit({ orgId: ctx.orgId, userId: ctx.userId, action: `${o.table}.created`, entityType: o.table, entityId: data.id, details: { name: body.name ?? body.title ?? null } });
      return json(data, 201);
    }),
  };
}

export function item(o: Opts & { auditDelete?: boolean }) {
  return {
    PATCH: handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      assertId(id);
      const ctx = await requireUser(o.action);
      const body = clean(await parseBody(req, o.schema.partial())) as Record<string, unknown>;
      await o.before?.(ctx, body);
      const supabase = await createClient();
      const { data, error } = await supabase.from(o.table).update(body).eq("id", id).eq("org_id", ctx.orgId).select("*");
      dbError(error, o.label);
      assertAffected(data, o.label);
      return json(data![0]);
    }),
    DELETE: handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      assertId(id);
      const ctx = await requireUser(o.action);
      const supabase = await createClient();
      const { data, error } = await supabase.from(o.table).delete().eq("id", id).eq("org_id", ctx.orgId).select("id");
      dbError(error, o.label);
      assertAffected(data, o.label);
      await audit({ orgId: ctx.orgId, userId: ctx.userId, action: `${o.table}.deleted`, entityType: o.table, entityId: id });
      return json({ ok: true });
    }),
  };
}
