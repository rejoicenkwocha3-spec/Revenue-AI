import Link from "next/link";
import { Bell } from "lucide-react";
import { requireAppContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/app/ui";
import { formatDateTime } from "@/lib/utils";
import { MarkAllRead } from "./MarkAllRead";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("id, title, body, link, read_at, created_at").eq("user_id", ctx.userId).order("created_at", { ascending: false }).limit(100);
  const unread = (data ?? []).filter((n) => !n.read_at).length;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Notifications" description="Processing updates, review requests, invitations and billing events." actions={unread ? <MarkAllRead /> : null} />
      {!data?.length ? (
        <EmptyState icon={Bell} title="You are all caught up" body="Notifications about your projects and team appear here." />
      ) : (
        <ul className="card divide-y divide-line">
          {data.map((n) => {
            const inner = (
              <div className="flex gap-3 px-5 py-4">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-coral"}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${n.read_at ? "text-body" : "font-semibold text-navy"}`}>{n.title}</p>
                  {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted">{formatDateTime(n.created_at)}</p>
                </div>
              </div>
            );
            return <li key={n.id}>{n.link ? <Link href={n.link} className="block hover:bg-canvas/60">{inner}</Link> : inner}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
