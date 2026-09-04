"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, Search, Filter, ChevronRight, ArrowLeft, Loader2 } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1").replace(/\/$/, "");

interface NotifItem {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: { label: string; href: string };
}

interface CategoryTab {
  value: string;
  label: string;
}

// Shape returned by GET /api/v1/notifications (notifications rows).
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

const icon: Record<string, string> = {
  success: "✅", info: "ℹ️", warning: "⚠️", error: "🚨",
};

function mapRow(row: ApiNotificationRow): NotifItem {
  return {
    id: String(row.id),
    type: row.type || "info",
    category: row.category || "system",
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

interface LoadResult {
  notifications: NotifItem[];
  error: string | null;
}

// Pure data fetch (no component state) so callers control when state updates.
async function loadNotificationsFromApi(): Promise<LoadResult> {
  try {
    const res = await fetch(`${API_BASE}/notifications`, { credentials: "include" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        return { notifications: [], error: "Please sign in to view your notifications." };
      }
      return { notifications: [], error: body.error?.message || body.error || "Failed to load notifications." };
    }
    return { notifications: (body.data || []).map(mapRow), error: null };
  } catch {
    return { notifications: [], error: "Network error. Please try again." };
  }
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Apply a fetch result to component state (called after await in the effect
  // below or from the retry event handler).
  const applyResult = useCallback((result: LoadResult) => {
    setNotifications(result.notifications);
    setLoadError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const result = await loadNotificationsFromApi();
      if (alive) applyResult(result);
    })();
    return () => {
      alive = false;
    };
  }, [applyResult]);

  // Retry from the error state.
  const retry = () => {
    setLoading(true);
    setLoadError(null);
    loadNotificationsFromApi().then(applyResult);
  };

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "all") return true;
    return n.category === filter;
  }).filter(n => {
    if (!search) return true;
    return n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase());
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (id: string) => {
    // Optimistic update, then confirm with the server.
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {
      // Keep the optimistic state; the next load() reconciles.
    });
  };

  const markAllRead = () => {
    if (unreadCount === 0) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  };

  const categories: CategoryTab[] = [
    { value: "all", label: "All" },
    { value: "unread", label: "Unread" },
  ];
  const knownCategories = ["voting", "election", "candidate", "support", "account", "system", "results"];
  for (const c of knownCategories) {
    if (notifications.some(n => n.category === c)) {
      categories.push({ value: c, label: c[0].toUpperCase() + c.slice(1) });
    }
  }

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
            <p className="text-sm text-text-secondary">
              {loading ? "Loading..." : `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
            </p>
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
          {categories.map(cat => {
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
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={32} className="animate-spin text-primary-600" />
            <p className="text-sm text-text-secondary">Loading notifications...</p>
          </div>
        )}

        {!loading && loadError && (
          <div className="text-center py-16 px-4">
            <Bell size={48} className="mx-auto text-border mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">Couldn&apos;t load notifications</h3>
            <p className="text-sm text-text-secondary mb-4">{loadError}</p>
            <button onClick={retry} className="text-sm font-medium text-primary-800 hover:text-primary-500">
              Try again
            </button>
          </div>
        )}

        {!loading && !loadError && (
          <>
            {unread.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 px-1">New</h2>
                <div className="space-y-2">
                  {unread.map(n => (
                    <div key={n.id}
                      className="bg-white dark:bg-bg-secondary rounded-[14px] border border-border p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => markRead(n.id)}>
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{icon[n.type] || icon.info}</span>
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
                        <span className="text-lg">{icon[n.type] || icon.info}</span>
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
          </>
        )}
      </div>
    </div>
  );
}

function formatTime(ts: string) {
  const t = new Date(ts).getTime();
  if (!t) return "";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}
