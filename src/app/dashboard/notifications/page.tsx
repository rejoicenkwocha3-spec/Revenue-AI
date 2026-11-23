"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, CheckCircle2 } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("cb_notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      setNotifications(data || []);
      setLoading(false);
    })();
  }, []);

  async function markRead(id: string) {
    await supabase.from("cb_notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("cb_notifications").update({ read: true }).eq("user_id", user!.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "760px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B" }}>Notifications</h1>
            {unread > 0 && (
              <span style={{ background: "#174D36", color: "#D9AD55", fontSize: "0.7rem", fontWeight: 800, padding: "0.15rem 0.55rem", borderRadius: "999px" }}>{unread}</span>
            )}
          </div>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>System alerts and activity updates</p>
        </div>
        {unread > 0 && (
          <button className="btn-ghost" style={{ fontSize: "0.8125rem" }} onClick={markAllRead}>Mark all read</button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1,2,3].map((i) => <div key={i} style={{ background: "#FFF", border: "1px solid #DDE8E2", borderRadius: "0.875rem", height: "72px" }} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1.5px dashed #DDE8E2", borderRadius: "1rem", padding: "3.5rem 2rem", textAlign: "center" }}>
          <Bell size={40} style={{ color: "#DDE8E2", margin: "0 auto 1rem", display: "block" }} />
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.125rem", color: "#0B352B", marginBottom: "0.5rem" }}>No notifications</h3>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>You are up to date.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {notifications.map((n) => (
            <div key={n.id} style={{ background: n.read ? "#FFFFFF" : "#F0F7F3", border: `1px solid ${n.read ? "#DDE8E2" : "#A8C9B2"}`, borderRadius: "0.875rem", padding: "1rem 1.25rem", display: "flex", gap: "0.875rem", alignItems: "flex-start", cursor: n.read ? "default" : "pointer" }} onClick={() => !n.read && markRead(n.id)}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: n.read ? "#F7F8F3" : "#E8F2EC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {n.read ? <CheckCircle2 size={16} style={{ color: "#9BAF9A" }} /> : <Bell size={16} style={{ color: "#174D36" }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-manrope)", fontWeight: n.read ? 500 : 700, fontSize: "0.9rem", color: "#0B352B" }}>{n.title}</div>
                {n.body && <p style={{ fontSize: "0.8125rem", color: "#5A6B61", margin: "0.2rem 0 0" }}>{n.body}</p>}
                <div style={{ fontSize: "0.75rem", color: "#9BAF9A", marginTop: "0.3rem" }}>{new Date(n.created_at).toLocaleString("en-GB")}</div>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#174D36", flexShrink: 0, marginTop: "0.4rem" }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
