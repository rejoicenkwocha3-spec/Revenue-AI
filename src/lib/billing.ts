import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan, trialMinutes, TRIAL_STORAGE_GB, type Plan } from "@/config/plans";
import { ApiError } from "@/lib/api";

export interface Entitlements {
  plan: Plan | null;
  subscription: { id: string; status: string; currentPeriodEnd: string | null; currentPeriodStart: string } | null;
  periodStart: string;
  minutesIncluded: number;
  minutesUsed: number;
  minutesRemaining: number;
  storageBytesIncluded: number;
  storageBytesUsed: number;
  targetLanguagesPerProject: number;
  seats: number;
  voiceClones: number;
}

const GB = 1024 ** 3;

export async function getEntitlements(orgId: string): Promise<Entitlements> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, plan_id, status, current_period_start, current_period_end")
    .eq("org_id", orgId)
    .eq("status", "active")
    .or(`current_period_end.is.null,current_period_end.gt.${nowIso}`)
    .order("current_period_end", { ascending: false, nullsFirst: true })
    .limit(1)
    .maybeSingle();

  const plan = sub ? getPlan(sub.plan_id) ?? null : null;
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const periodStart = sub?.current_period_start ?? monthStart.toISOString();

  const [{ data: usage }, { data: storage }] = await Promise.all([
    admin.from("usage_records").select("quantity").eq("org_id", orgId).eq("kind", "dub_minutes").gte("created_at", periodStart),
    admin.rpc("org_storage_bytes", { p_org: orgId }),
  ]);
  const minutesUsed = Math.round((usage ?? []).reduce((a, r) => a + Number(r.quantity), 0) * 100) / 100;
  const minutesIncluded = plan ? plan.monthlyMinutes : trialMinutes();

  return {
    plan,
    subscription: sub
      ? { id: sub.id, status: sub.status, currentPeriodEnd: sub.current_period_end, currentPeriodStart: sub.current_period_start }
      : null,
    periodStart,
    minutesIncluded,
    minutesUsed,
    minutesRemaining: Math.max(0, minutesIncluded - minutesUsed),
    storageBytesIncluded: (plan ? plan.storageGb : TRIAL_STORAGE_GB) * GB,
    storageBytesUsed: Number(storage ?? 0),
    targetLanguagesPerProject: plan ? plan.targetLanguagesPerProject : 1,
    seats: plan ? plan.seats : 1,
    voiceClones: plan ? plan.voiceClones : 0,
  };
}

export async function assertMinutesAvailable(orgId: string, minutesNeeded: number) {
  const e = await getEntitlements(orgId);
  if (e.minutesIncluded === 0) {
    throw new ApiError(402, "An active subscription is required to generate dubs. Choose a plan on the Billing page.", "subscription_required");
  }
  if (minutesNeeded > e.minutesRemaining) {
    throw new ApiError(
      402,
      `This dub needs ${minutesNeeded.toFixed(1)} minutes but ${e.minutesRemaining.toFixed(1)} remain in this billing period.`,
      "minutes_exhausted",
    );
  }
  return e;
}

export async function assertStorageAvailable(orgId: string, bytes: number) {
  const e = await getEntitlements(orgId);
  if (e.storageBytesUsed + bytes > e.storageBytesIncluded) {
    throw new ApiError(402, "This upload would exceed your storage allowance. Delete unused media or upgrade your plan.", "storage_exhausted");
  }
  return e;
}
