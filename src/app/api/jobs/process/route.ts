import { NextResponse } from "next/server";
import { runWorker } from "@/lib/pipeline/queue";

export const maxDuration = 300;

function authorised(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Worker endpoint for a scheduler (Vercel Cron) or the standalone worker script. Requires CRON_SECRET. */
async function run(req: Request) {
  if (!authorised(req)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  try {
    const result = await runWorker({ budgetMs: 270_000 });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
export const GET = run;
export const POST = run;
