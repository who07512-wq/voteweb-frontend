"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import type { Notification } from "@/lib/notification-data";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1").replace(/\/$/, "");

interface ApiNotificationRow {
  id: number;
  type: string;
  category: string;
  title: string;
  message: string | null;
  created_at: string;
  is_read: boolean;
  action_url: string | null;
  action_label: string | null;
}

function mapRow(row: ApiNotificationRow): Notification {
  return {
    id: String(row.id),
    type: (row.type || "info") as Notification["type"],
    category: "system",
    priority: "normal",
    title: row.title,
    message: row.message || "",
    timestamp: row.created_at,
    read: !!row.is_read,
    action:
      row.action_url && row.action_label
        ? { label: row.action_label, href: row.action_url }
        : undefined,
  };
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/unread-count`, { credentials: "include" });
      if (!res.ok) return;
      const body = await res.json().catch(() => ({}));
      setUnreadCount(body.data?.unread_count ?? 0);
    } catch {
      // Bell is non-critical; keep whatever we have.
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications?limit=6`, { credentials: "include" });
      if (!res.ok) return;
      const body = await res.json().catch(() => ({}));
      const rows: ApiNotificationRow[] = body.data || [];
      setNotifications(rows.map(mapRow));
    } catch {
      // Bell is non-critical; keep whatever we have.
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      await refreshCount();
      if (!alive) return;
      await load();
    })();
    const poll = setInterval(() => {
      refreshCount();
    }, 30000);
    const onFocus = () => {
      refreshCount();
    };
    window.addEventListener("focus", onFocus);
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => {
      alive = false;
      clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("mousedown", handler);
    };
  }, [refreshCount, load]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen(!open); if (!open) { load(); refreshCount(); } }}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
        className="relative p-2 rounded-full hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-primary-600">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error-600 rounded-full ring-2 ring-white dark:ring-[#252540]" />
        )}
      </button>
      {open && (
        <div className="fixed sm:absolute right-3 sm:right-0 top-[4.25rem] sm:top-full sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#252540] rounded-[14px] shadow-lg border border-border py-2 z-50 max-h-[70vh] overflow-y-auto">
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <span className="font-semibold text-sm text-text-primary">Notifications</span>
            {unreadCount > 0 && <span className="text-xs text-text-secondary">{unreadCount} new</span>}
          </div>
          {notifications.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-text-secondary">No notifications</p>
          )}
          {notifications.slice(0, 6).map(n => (
            <Link key={n.id} href={n.action?.href || "/notifications"}
              onClick={() => setOpen(false)}
              className={`block px-4 py-3 hover:bg-bg-tertiary transition-colors ${!n.read ? "bg-bg-tertiary/40" : ""}`}>
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.read ? "bg-primary-600" : "bg-transparent"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{n.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5 truncate">{n.message}</p>
                </div>
              </div>
            </Link>
          ))}
          <Link href="/notifications" onClick={() => setOpen(false)}
            className="block text-center text-xs font-medium text-primary-600 hover:text-primary-500 py-2 border-t border-border">
            View All Notifications
          </Link>
        </div>
      )}
    </div>
  );
}