import { handle, json, ApiError, requireUser } from "@/lib/api";
import { signedUrl } from "@/lib/storage";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";

const BUCKETS = new Set(["media", "generated", "exports", "voice-samples"]);

/** Issues a short lived signed URL for a private object after checking workspace membership. */
export const GET = handle(async (req: Request) => {
  const ctx = await requireUser();
  const url = new URL(req.url);
  const bucket = url.searchParams.get("bucket") ?? "";
  const path = url.searchParams.get("path") ?? "";
  const download = url.searchParams.get("download");
  if (!BUCKETS.has(bucket) || !path || path.includes("..")) throw new ApiError(400, "Invalid file reference.");
  const orgId = path.split("/")[0];
  const membership = ctx.memberships.find((m) => m.orgId === orgId);
  if (!membership || !can(membership.role, "export.download")) throw new ApiError(404, "File not found.");
  const name = download ? path.split("/").pop() : undefined;
  const signed = await signedUrl(bucket, path, 600, name);
  if (download && bucket === "exports") {
    await logActivity({ orgId, userId: ctx.userId, action: "export.downloaded", details: { file: name } });
  }
  return json({ url: signed, expiresIn: 600 });
});
