#!/usr/bin/env node
/**
 * Standalone LinguaDub worker. Repeatedly calls the protected worker endpoint so long
 * processing jobs keep moving without relying on a platform scheduler.
 *
 *   APP_URL=https://your-domain CRON_SECRET=... node scripts/worker.mjs
 */
const url = `${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}/api/jobs/process`;
const secret = process.env.CRON_SECRET;
if (!secret) {
  console.error("Set CRON_SECRET");
  process.exit(1);
}
const idleMs = Number(process.env.WORKER_IDLE_MS ?? 10000);
for (;;) {
  try {
    const res = await fetch(url, { method: "POST", headers: { authorization: `Bearer ${secret}` } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) console.error(new Date().toISOString(), res.status, body);
    else if (body.processed) console.log(new Date().toISOString(), `processed ${body.processed} job(s)`);
    if (!body.processed) await new Promise((r) => setTimeout(r, idleMs));
  } catch (e) {
    console.error(new Date().toISOString(), e.message);
    await new Promise((r) => setTimeout(r, idleMs));
  }
}
