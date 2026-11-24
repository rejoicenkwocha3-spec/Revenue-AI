import Link from "next/link";
import { Contact, Plus } from "lucide-react";
import { pageData } from "@/lib/page";
import { accountName } from "@/lib/revenue/metrics";
import { optionsFrom } from "@/lib/options";
import { can } from "@/lib/permissions";
import { timeAgo } from "@/lib/utils";
import { PageHeader, Card, EmptyState } from "@/components/app/ui";
import { FormButton, ActionButton } from "@/components/app/forms";
import { contactFields } from "@/components/app/fieldsets";

export const metadata = { title: "Contacts" };

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const { ctx, data } = await pageData();
  const opts = optionsFrom(data);
  const term = q.toLowerCase();
  const list = data.contacts.filter((c) => !term || `${c.first_name} ${c.last_name ?? ""} ${c.email ?? ""} ${accountName(data, c.account_id)}`.toLowerCase().includes(term)).sort((a, b) => (b.last_contacted_at ?? "").localeCompare(a.last_contacted_at ?? ""));
  const write = can(ctx.role, "crm.write");
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader title="Contacts" description="Buyer contacts, their roles in buying decisions and when they were last engaged." actions={write && <FormButton label="New contact" icon={<Plus size={15} />} title="New contact" endpoint="/api/contacts" fields={contactFields(opts)} />} />
      <form><label htmlFor="c-q" className="sr-only">Search contacts</label><input id="c-q" name="q" defaultValue={q} className="input max-w-sm" placeholder="Search by name, email or account" /></form>
      <Card bodyClass="p-0">
        {list.length ? (
          <div className="overflow-x-auto">
            <table className="table min-w-[860px]">
              <thead><tr><th>Name</th><th>Account</th><th>Title</th><th>Buying role</th><th>Email</th><th>Last contacted</th><th /></tr></thead>
              <tbody>{list.map((c) => <tr key={c.id}><td className="font-semibold text-ink">{c.first_name} {c.last_name}</td><td>{c.account_id ? <Link href={`/dashboard/accounts/${c.account_id}`} className="text-blue hover:underline">{accountName(data, c.account_id)}</Link> : "None"}</td><td>{c.title}</td><td className="capitalize">{c.buying_role?.replace(/_/g, " ")}</td><td className="text-muted">{c.email}</td><td className="text-muted">{c.last_contacted_at ? timeAgo(c.last_contacted_at) : "Never"}</td><td className="text-right">{write && <span className="inline-flex gap-1"><FormButton label="Edit" className="btn btn-ghost btn-xs" title="Edit contact" endpoint={`/api/contacts/${c.id}`} method="PATCH" fields={contactFields(opts)} initial={{ first_name: c.first_name, last_name: c.last_name ?? "", email: c.email ?? "", title: c.title ?? "", account_id: c.account_id ?? "", buying_role: c.buying_role ?? "" }} />{can(ctx.role, "deal.manage_any") && <ActionButton endpoint={`/api/contacts/${c.id}`} method="DELETE" label="Delete" confirm="Delete?" className="btn btn-ghost btn-xs" />}</span>}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <EmptyState icon={Contact} title="No contacts" body="Add buyer contacts and link them to deals as stakeholders." />}
      </Card>
    </div>
  );
}
