"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { MOCK_NOTIFICATIONS, type Notification } from "@/lib/notification-data";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unread = MOCK_NOTIFICATIONS.filter(n => !n.read).length;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-primary-600">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-error-600 rounded-full" />
        )}
      </button>
      {open && (
        <div className="fixed sm:absolute right-3 sm:right-0 top-[4.25rem] sm:top-full sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#252540] rounded-[14px] shadow-lg border border-border py-2 z-50 max-h-[70vh] overflow-y-auto">
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <span className="font-semibold text-sm text-text-primary">Notifications</span>
            {unread > 0 && <span className="text-xs text-text-secondary">{unread} new</span>}
          </div>
          {MOCK_NOTIFICATIONS.slice(0, 6).map(n => (
            <Link key={n.id} href={n.action?.href || "/student/dashboard"}
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
