"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Info, AlertCircle, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read: boolean;
  created_at: string;
}

const demoNotifications: Notification[] = [
  { id: "1", title: "Index rebuild complete", body: "Your Products index finished rebuilding with 1,240 records.", type: "success", read: false, created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: "2", title: "Zero result spike detected", body: "Query 'enterprise sso' saw a 300% increase in zero-result searches today.", type: "warning", read: false, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: "3", title: "Search volume milestone", body: "You have crossed 10,000 search queries this month.", type: "info", read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: "4", title: "New data source indexed", body: "Blog sitemap indexed successfully: 87 pages.", type: "success", read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(demoNotifications);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  const unread = notifications.filter((n) => !n.read).length;

  function iconFor(type: string) {
    if (type === "warning") return <AlertCircle size={18} color="#F59E0B" />;
    if (type === "success") return <TrendingUp size={18} color="#16C653" />;
    return <Info size={18} color="#65736D" />;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#071F20", margin: "0 0 0.25rem" }}>Notifications</h1>
          <p style={{ color: "#65736D", fontSize: "0.9375rem", margin: 0 }}>
            {unread > 0 ? `${unread} unread notification${unread > 1 ? "s" : ""}` : "All caught up."}
          </p>
        </div>
        {unread > 0 && (
          <button className="btn-ghost" onClick={markAllRead} style={{ fontSize: "0.875rem" }}>
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => markRead(n.id)}
            className="card-ss"
            style={{
              display: "flex", alignItems: "flex-start", gap: "1rem",
              opacity: n.read ? 0.7 : 1,
              cursor: n.read ? "default" : "pointer",
              borderLeft: n.read ? "1px solid #DCE8E2" : "3px solid #16C653",
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: "0.5rem", background: "#F7FAF8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {iconFor(n.type)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{ fontWeight: n.read ? 500 : 700, fontSize: "0.9375rem", color: "#071F20" }}>{n.title}</span>
                <span style={{ fontSize: "0.8125rem", color: "#65736D", whiteSpace: "nowrap" }}>{timeAgo(n.created_at)}</span>
              </div>
              {n.body && <p style={{ color: "#65736D", fontSize: "0.875rem", margin: "0.25rem 0 0", lineHeight: 1.5 }}>{n.body}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
