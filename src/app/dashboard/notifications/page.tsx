"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { createClient } from "@/lib/supabase/client";
import { Bell, CheckCheck } from "lucide-react";

type Notification = {
  id: string;
  title: string | null;
  body: string | null;
  read: boolean;
  created_at: string;
  type: string | null;
};

type User = { id: string; email?: string; user_metadata?: Record<string, string> };

export default function NotificationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, read, created_at, type")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUser(user);
      fetchNotifications(user.id);
    });
  }, [fetchNotifications]);

  async function markAllRead() {
    if (!user) return;
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <DashboardHeader title="Notifications" user={{ name: user?.user_metadata?.full_name, email: user?.email }} />
      <div style={{ padding: "2rem", flex: 1, maxWidth: 720 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: 0 }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up"}
          </p>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "1.5px solid #D1DCF0", borderRadius: 8, padding: "0.5rem 1rem", cursor: "pointer", color: "#155EEF", fontWeight: 600, fontSize: "0.875rem" }}>
              <CheckCheck size={16} /> Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "2rem" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 56, background: "#F5F8FC", borderRadius: 8, marginBottom: "0.75rem", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "4rem 2rem", textAlign: "center" }}>
            <Bell size={40} color="#D1DCF0" style={{ marginBottom: "1rem" }} />
            <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.125rem", color: "#102A43", margin: "0 0 0.5rem" }}>No notifications</h3>
            <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: 0 }}>You will be notified here when analyses complete, documents are shared with you, or team activity occurs.</p>
          </div>
        ) : (
          <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, overflow: "hidden" }}>
            {notifications.map((n, i) => (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1rem 1.25rem",
                  borderBottom: i < notifications.length - 1 ? "1px solid #F5F8FC" : "none",
                  background: n.read ? "#ffffff" : "#F7F9FF",
                  cursor: n.read ? "default" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: n.read ? "#D1DCF0" : "#155EEF", flexShrink: 0, marginTop: "0.4rem" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: n.read ? 500 : 700, fontSize: "0.9rem", color: "#102A43", margin: "0 0 0.25rem" }}>
                    {n.title ?? "Notification"}
                  </p>
                  {n.body && <p style={{ color: "#64748B", fontSize: "0.875rem", margin: "0 0 0.375rem", lineHeight: 1.5 }}>{n.body}</p>}
                  <p style={{ color: "#94A3B8", fontSize: "0.75rem", margin: 0 }}>
                    {new Date(n.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {!n.read && (
                  <span style={{ background: "#EEF3FD", color: "#155EEF", fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 100, flexShrink: 0 }}>NEW</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
