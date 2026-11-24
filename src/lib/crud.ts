import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function assertId(id: string) {
  if (!UUID.test(id)) throw new ApiError(404, "Not found.");
}

/** Converts database errors into readable API errors. RLS refusals become 403. */
export function dbError(error: PostgrestError | null, what = "record"): never | void {
  if (!error) return;
  if (error.code === "42501" || /row-level security/i.test(error.message)) throw new ApiError(403, `Your role does not allow you to change this ${what}.`);
  if (error.code === "23505") throw new ApiError(409, `A ${what} with these details already exists.`);
  if (error.code === "23503") throw new ApiError(400, `A linked record for this ${what} does not exist.`);
  if (error.code === "23514") throw new ApiError(400, `Some values for this ${what} are not allowed.`);
  throw new ApiError(500, error.message);
}

/** RLS silently filters updates and deletes the user may not perform; zero affected rows means no access. */
export function assertAffected(rows: unknown[] | null, what = "record") {
  if (!rows || rows.length === 0) throw new ApiError(403, `This ${what} was not found or your role does not allow changing it.`);
}

/** Converts empty strings to null so optional fields clear correctly. */
export function clean<T extends Record<string, unknown>>(o: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v === "" ? null : v;
  return out as T;
}
