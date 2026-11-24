import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { decrypt } from "./crypto";
import { accessToken } from "./oauth";
import type { ProviderKey } from "./providers";

interface Ctx { orgId: string; integrationId: string; key: ProviderKey; mapping: Record<string, unknown> }
interface Counters { created: number; updated: number; errors: string[] }

async function getJson(url: string, token: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, headers: { authorization: `Bearer ${token}`, accept: "application/json", ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(`${new URL(url).hostname} returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

/** Upserts records by external id and counts creates versus updates. */
async function upsert(table: string, rows: Record<string, unknown>[], c: Counters, orgId: string, source: string) {
  if (!rows.length) return [] as { id: string; external_id: string }[];
  const admin = createAdminClient();
  const ids = rows.map((r) => String(r.external_id));
  const { data: existing } = await admin.from(table).select("external_id").eq("org_id", orgId).eq("external_source", source).in("external_id", ids);
  const known = new Set((existing ?? []).map((e) => e.external_id));
  const { data, error } = await admin.from(table).upsert(rows.map((r) => ({ ...r, org_id: orgId, external_source: source })), { onConflict: "org_id,external_source,external_id" }).select("id, external_id");
  if (error) { c.errors.push(`${table}: ${error.message}`); return []; }
  c.updated += rows.filter((r) => known.has(String(r.external_id))).length;
  c.created += rows.filter((r) => !known.has(String(r.external_id))).length;
  return (data ?? []) as { id: string; external_id: string }[];
}

async function stageResolver(orgId: string, mapping: Record<string, unknown>) {
  const { data: stages } = await createAdminClient().from("pipeline_stages").select("id, name, kind, position").eq("org_id", orgId).order("position");
  const list = stages ?? [];
  const manual = (mapping.stages ?? {}) as Record<string, string>;
  const unmapped = new Set<string>();
  return {
    resolve(name: string | null | undefined, won: boolean, lost: boolean): string {
      if (won) return list.find((s) => s.kind === "won")!.id;
      if (lost) return list.find((s) => s.kind === "lost")!.id;
      const n = (name ?? "").toLowerCase();
      if (manual[name ?? ""] && list.some((s) => s.id === manual[name ?? ""])) return manual[name ?? ""];
      const match = list.find((s) => s.kind === "open" && (s.name.toLowerCase() === n || n.includes(s.name.toLowerCase())));
      if (match) return match.id;
      if (name) unmapped.add(name);
      return list.find((s) => s.kind === "open")!.id;
    },
    unmapped,
  };
}

const lookup = (rows: { id: string; external_id: string }[]) => new Map(rows.map((r) => [r.external_id, r.id]));


async function syncHubspot(x: Ctx, c: Counters) {
  const { token } = await accessToken(x.integrationId, x.key);
  const all = async (obj: string, props: string, assoc = "") => {
    const out: { id: string; properties: Record<string, string | null>; associations?: Record<string, { results: { id: string }[] }> }[] = [];
    let after: string | undefined;
    for (let i = 0; i < 20; i++) {
      const j = await getJson(`https://api.hubapi.com/crm/v3/objects/${obj}?limit=100&properties=${props}${assoc}${after ? `&after=${after}` : ""}`, token);
      out.push(...j.results);
      after = j.paging?.next?.after;
      if (!after) break;
    }
    return out;
  };
  const companies = await all("companies", "name,domain,industry,numberofemployees,country");
  const acc = lookup(await upsert("accounts", companies.map((r) => ({ external_id: r.id, name: r.properties.name || r.properties.domain || `HubSpot company ${r.id}`, domain: r.properties.domain, industry: r.properties.industry, employee_count: r.properties.numberofemployees ? Number(r.properties.numberofemployees) : null, region: r.properties.country })), c, x.orgId, "hubspot"));
  const contacts = await all("contacts", "firstname,lastname,email,jobtitle,phone", "&associations=companies");
  await upsert("contacts", contacts.map((r) => ({ external_id: r.id, first_name: r.properties.firstname || r.properties.email || "Unknown", last_name: r.properties.lastname, email: r.properties.email, title: r.properties.jobtitle, phone: r.properties.phone, account_id: acc.get(r.associations?.companies?.results?.[0]?.id ?? "") ?? null })), c, x.orgId, "hubspot");
  const deals = await all("deals", "dealname,amount,closedate,dealstage,hs_is_closed_won,hs_is_closed,hs_deal_stage_probability", "&associations=companies");
  const stages = await stageResolver(x.orgId, x.mapping);
  await upsert("opportunities", deals.map((r) => {
    const won = r.properties.hs_is_closed_won === "true";
    const lost = !won && r.properties.hs_is_closed === "true";
    return { external_id: r.id, name: r.properties.dealname || `HubSpot deal ${r.id}`, amount: Number(r.properties.amount ?? 0) || 0, close_date: r.properties.closedate?.slice(0, 10) ?? null, stage_id: stages.resolve(r.properties.dealstage, won, lost), account_id: acc.get(r.associations?.companies?.results?.[0]?.id ?? "") ?? null };
  }), c, x.orgId, "hubspot");
  if (stages.unmapped.size) c.errors.push(`Stages without a mapping were placed in the first open stage: ${[...stages.unmapped].join(", ")}. Map them under Data mapping.`);
}

async function syncPipedrive(x: Ctx, c: Counters) {
  const { token, instanceUrl } = await accessToken(x.integrationId, x.key);
  const base = `${instanceUrl ?? "https://api.pipedrive.com"}/api/v1`;
  const all = async (path: string) => {
    const out: Record<string, unknown>[] = [];
    let start = 0;
    for (let i = 0; i < 20; i++) {
      const j = await getJson(`${base}/${path}?limit=500&start=${start}`, token);
      out.push(...(j.data ?? []));
      if (!j.additional_data?.pagination?.more_items_in_collection) break;
      start = j.additional_data.pagination.next_start;
    }
    return out;
  };
  const orgs = await all("organizations");
  const acc = lookup(await upsert("accounts", orgs.map((o) => ({ external_id: String(o.id), name: String(o.name ?? `Pipedrive organisation ${o.id}`) })), c, x.orgId, "pipedrive"));
  const persons = await all("persons");
  await upsert("contacts", persons.map((p) => {
    const email = Array.isArray(p.email) ? (p.email as { value: string }[])[0]?.value : null;
    const orgId = p.org_id && typeof p.org_id === "object" ? String((p.org_id as { value: number }).value) : p.org_id ? String(p.org_id) : "";
    return { external_id: String(p.id), first_name: String(p.first_name || p.name || "Unknown"), last_name: (p.last_name as string) ?? null, email: email || null, account_id: acc.get(orgId) ?? null };
  }), c, x.orgId, "pipedrive");
  const { data: pdStages } = await getJson(`${base}/stages`, token);
  const stageName = new Map(((pdStages ?? []) as { id: number; name: string }[]).map((s) => [s.id, s.name]));
  const deals = await all("deals");
  const stages = await stageResolver(x.orgId, x.mapping);
  await upsert("opportunities", deals.map((d) => {
    const orgId = d.org_id && typeof d.org_id === "object" ? String((d.org_id as { value: number }).value) : d.org_id ? String(d.org_id) : "";
    return { external_id: String(d.id), name: String(d.title ?? `Pipedrive deal ${d.id}`), amount: Number(d.value ?? 0) || 0, close_date: (d.expected_close_date as string) ?? null, stage_id: stages.resolve(stageName.get(d.stage_id as number), d.status === "won", d.status === "lost"), account_id: acc.get(orgId) ?? null };
  }), c, x.orgId, "pipedrive");
  if (stages.unmapped.size) c.errors.push(`Stages without a mapping were placed in the first open stage: ${[...stages.unmapped].join(", ")}.`);
}

async function syncSalesforce(x: Ctx, c: Counters) {
  const { token, instanceUrl } = await accessToken(x.integrationId, x.key);
  if (!instanceUrl) throw new Error("Salesforce instance URL is missing. Reconnect the integration.");
  const query = async (soql: string) => {
    const out: Record<string, unknown>[] = [];
    let url: string | null = `${instanceUrl}/services/data/v60.0/query?q=${encodeURIComponent(soql)}`;
    for (let i = 0; url && i < 20; i++) {
      const j: { records: Record<string, unknown>[]; nextRecordsUrl?: string } = await getJson(url, token);
      out.push(...j.records);
      url = j.nextRecordsUrl ? `${instanceUrl}${j.nextRecordsUrl}` : null;
    }
    return out;
  };
  const accounts = await query("SELECT Id, Name, Website, Industry, NumberOfEmployees, BillingCountry FROM Account ORDER BY LastModifiedDate DESC LIMIT 5000");
  const acc = lookup(await upsert("accounts", accounts.map((a) => ({ external_id: a.Id, name: a.Name, domain: a.Website ?? null, industry: a.Industry ?? null, employee_count: a.NumberOfEmployees ?? null, region: a.BillingCountry ?? null })), c, x.orgId, "salesforce"));
  const contacts = await query("SELECT Id, FirstName, LastName, Email, Title, Phone, AccountId FROM Contact ORDER BY LastModifiedDate DESC LIMIT 10000");
  await upsert("contacts", contacts.map((p) => ({ external_id: p.Id, first_name: (p.FirstName as string) || (p.LastName as string) || "Unknown", last_name: p.FirstName ? p.LastName : null, email: p.Email ?? null, title: p.Title ?? null, phone: p.Phone ?? null, account_id: acc.get(String(p.AccountId)) ?? null })), c, x.orgId, "salesforce");
  const opps = await query("SELECT Id, Name, Amount, CloseDate, StageName, IsWon, IsClosed, Probability, AccountId, NextStep FROM Opportunity ORDER BY LastModifiedDate DESC LIMIT 10000");
  const stages = await stageResolver(x.orgId, x.mapping);
  await upsert("opportunities", opps.map((o) => ({ external_id: o.Id, name: o.Name, amount: Number(o.Amount ?? 0) || 0, close_date: o.CloseDate ?? null, probability: o.Probability != null ? Math.round(Number(o.Probability)) : null, next_step: o.NextStep ?? null, stage_id: stages.resolve(o.StageName as string, !!o.IsWon, !!o.IsClosed && !o.IsWon), account_id: acc.get(String(o.AccountId)) ?? null })), c, x.orgId, "salesforce");
  if (stages.unmapped.size) c.errors.push(`Stages without a mapping were placed in the first open stage: ${[...stages.unmapped].join(", ")}.`);
}

/** Calendar meetings in the last 30 and next 30 days, matched to accounts by attendee email domain. */
async function syncCalendar(x: Ctx, c: Counters) {
  const { token } = await accessToken(x.integrationId, x.key);
  const from = new Date(Date.now() - 30 * 86400000).toISOString();
  const to = new Date(Date.now() + 30 * 86400000).toISOString();
  let events: { id: string; title: string; start: string; end: string | null; attendees: string[] }[] = [];
  if (x.key === "google") {
    const j = await getJson(`https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=250&timeMin=${encodeURIComponent(from)}&timeMax=${encodeURIComponent(to)}`, token);
    events = (j.items ?? []).filter((e: { start?: { dateTime?: string } }) => e.start?.dateTime).map((e: { id: string; summary?: string; start: { dateTime: string }; end?: { dateTime?: string }; attendees?: { email: string }[] }) => ({ id: e.id, title: e.summary ?? "Meeting", start: e.start.dateTime, end: e.end?.dateTime ?? null, attendees: (e.attendees ?? []).map((a) => a.email) }));
  } else {
    const j = await getJson(`https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${from}&endDateTime=${to}&$top=250&$select=id,subject,start,end,attendees`, token, { headers: { Prefer: 'outlook.timezone="UTC"' } });
    events = (j.value ?? []).map((e: { id: string; subject?: string; start: { dateTime: string }; end?: { dateTime: string }; attendees?: { emailAddress: { address: string } }[] }) => ({ id: e.id, title: e.subject ?? "Meeting", start: `${e.start.dateTime.slice(0, 19)}Z`, end: e.end ? `${e.end.dateTime.slice(0, 19)}Z` : null, attendees: (e.attendees ?? []).map((a) => a.emailAddress.address) }));
  }
  const { data: accounts } = await createAdminClient().from("accounts").select("id, domain").eq("org_id", x.orgId).not("domain", "is", null);
  const byDomain = new Map((accounts ?? []).map((a) => [String(a.domain).replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase(), a.id]));
  const matched = events.map((e) => ({ e, account: e.attendees.map((a) => byDomain.get(a.split("@")[1]?.toLowerCase() ?? "")).find(Boolean) ?? null })).filter((m) => m.account);
  await upsert("meetings", matched.map(({ e, account }) => ({ external_id: e.id, title: e.title.slice(0, 300), starts_at: e.start, ends_at: e.end, attendees: e.attendees.slice(0, 50), account_id: account, status: new Date(e.start) < new Date() ? "completed" : "scheduled" })), c, x.orgId, x.key);
  if (events.length && !matched.length) c.errors.push("No calendar meetings matched an account. Add website domains to accounts so attendees can be matched.");
}

/** Runs a sync and records it in sync history. */
export async function runSync(integrationId: string, trigger: "manual" | "automatic", actor: string | null) {
  const admin = createAdminClient();
  const { data: integ } = await admin.from("integrations").select("*").eq("id", integrationId).maybeSingle();
  if (!integ || integ.status !== "connected") throw new Error("Integration is not connected.");
  const { data: run } = await admin.from("integration_sync_runs").insert({ org_id: integ.org_id, integration_id: integ.id, trigger }).select("id").single();
  const c: Counters = { created: 0, updated: 0, errors: [] };
  const x: Ctx = { orgId: integ.org_id, integrationId: integ.id, key: integ.provider, mapping: integ.field_mapping ?? {} };
  let failed = false;
  try {
    if (x.key === "hubspot") await syncHubspot(x, c);
    else if (x.key === "pipedrive") await syncPipedrive(x, c);
    else if (x.key === "salesforce") await syncSalesforce(x, c);
    else if (x.key === "google" || x.key === "microsoft") await syncCalendar(x, c);
    else if (x.key === "slack") await postToSlack(x.orgId, "Revenue AI is connected to this channel. Agent approvals and deal risk alerts will appear here.");
  } catch (err) {
    failed = true;
    c.errors.push((err as Error).message);
  }
  const status = failed ? "failed" : c.errors.length ? "partial" : "succeeded";
  await admin.from("integration_sync_runs").update({ status, records_created: c.created, records_updated: c.updated, errors: c.errors, finished_at: new Date().toISOString() }).eq("id", run!.id);
  await admin.from("integrations").update({ last_synced_at: new Date().toISOString(), last_error: failed ? c.errors.at(-1) : null, status: failed ? "error" : "connected", updated_at: new Date().toISOString() }).eq("id", integ.id);
  await audit({ orgId: integ.org_id, userId: actor, actorType: actor ? "user" : "integration", action: "integration.synced", entityType: "integrations", entityId: integ.id, details: { provider: integ.provider, status, created: c.created, updated: c.updated } });
  return { status, ...c };
}

/** Posts a message to the organisation's connected Slack channel, if any. Failures never block the caller. */
export async function postToSlack(orgId: string, text: string) {
  const admin = createAdminClient();
  const { data: integ } = await admin.from("integrations").select("id").eq("org_id", orgId).eq("provider", "slack").eq("status", "connected").maybeSingle();
  if (!integ) return false;
  const { data: cred } = await admin.from("integration_credentials").select("extra").eq("integration_id", integ.id).maybeSingle();
  const url = decrypt((cred?.extra as { webhook_enc?: string } | null)?.webhook_enc ?? null);
  if (!url) return false;
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
  if (!res.ok) throw new Error(`Slack returned ${res.status}`);
  return true;
}
