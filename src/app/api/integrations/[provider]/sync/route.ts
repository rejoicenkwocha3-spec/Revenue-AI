import { handle, json, requireUser, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { runSync } from "@/lib/integrations/sync";

export const maxDuration = 300;

export const POST = handle(async (_req: Request, { params }: { params: Promise<{ provider: string }> }) => {
  const { provider } = await params;
  const ctx = await requireUser("integration.manage");
  const { data: integ } = await createAdminClient().from("integrations").select("id, status").eq("org_id", ctx.orgId).eq("provider", provider).maybeSingle();
  if (!integ || integ.status === "disconnected") throw new ApiError(409, "Connect this integration first.");
  try {
    return json(await runSync(integ.id, "manual", ctx.userId));
  } catch (err) {
    throw new ApiError(502, (err as Error).message);
  }
});
