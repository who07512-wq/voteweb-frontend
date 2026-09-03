"use client";
import { useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, Search, Filter, ChevronRight, ArrowLeft } from "lucide-react";
import { MOCK_NOTIFICATIONS, NOTIFICATION_CATEGORIES, type Notification } from "@/lib/notification-data";

const icon: Record<string, string> = {
  success: "✅", info: "ℹ️", warning: "⚠️", error: "🚨",
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter !== "all" && n.category !== filter) return false;
    if (search) return n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unread = filtered.filter(n => !n.read);
  const read = filtered.filter(n => n.read);

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="bg-white dark:bg-bg-secondary border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/student/dashboard" className="p-2 hover:bg-primary-50 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
            <p className="text-sm text-text-secondary">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-primary-800 font-medium hover:text-primary-500 flex items-center gap-1">
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input type="text" placeholder="Search notifications..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-primary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-text-muted" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {NOTIFICATION_CATEGORIES.map(cat => {
            const count = cat.value === "all" ? notifications.length : cat.value === "unread" ? unreadCount : notifications.filter(n => n.category === cat.value).length;
            return (
              <button key={cat.value} onClick={() => setFilter(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filter === cat.value ? "bg-primary-800 text-white" : "bg-white text-text-secondary hover:bg-primary-50 border border-border"}`}>
                <Filter size={12} />
                {cat.label}
                {count > 0 && <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-current/10 text-[10px]">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-8">
        {unread.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 px-1">New</h2>
            <div className="space-y-2">
              {unread.map(n => (
                <div key={n.id}
                  className="bg-white dark:bg-bg-secondary rounded-[14px] border border-border p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => markRead(n.id)}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{icon[n.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{n.title}</p>
                      <p className="text-sm text-text-secondary mt-0.5">{n.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-text-secondary">{formatTime(n.timestamp)}</span>
                        {n.action && (
                          <Link href={n.action.href} onClick={e => e.stopPropagation()}
                            className="text-xs font-medium text-primary-800 hover:text-primary-500 flex items-center gap-1">
                            {n.action.label} <ChevronRight size={12} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {read.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 px-1">Earlier</h2>
            <div className="space-y-2">
              {read.map(n => (
                <div key={n.id}
                  className="bg-white dark:bg-bg-secondary rounded-[14px] border border-border p-4 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => markRead(n.id)}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{icon[n.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{n.title}</p>
                      <p className="text-sm text-text-secondary mt-0.5">{n.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-text-secondary">{formatTime(n.timestamp)}</span>
                        {n.action && (
                          <Link href={n.action.href} onClick={e => e.stopPropagation()}
                            className="text-xs font-medium text-primary-800 hover:text-primary-500 flex items-center gap-1">
                            {n.action.label} <ChevronRight size={12} />
                          </Link>
                        )}
                      </div>
                    </div>
                    <Check size={16} className="text-success-500 shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Bell size={48} className="mx-auto text-border mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">No notifications</h3>
            <p className="text-sm text-text-secondary">
              {search ? "Try adjusting your search" : filter === "unread" ? "All caught up!" : "You have no notifications in this category."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}
