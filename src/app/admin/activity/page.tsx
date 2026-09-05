"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { adminApi, type AuditLogRecord } from "@/lib/api/admin";
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Vote,
  Users,
  Shield,
} from "lucide-react";

const EVENT_FILTERS = ["All", "LOGIN", "VOTE", "ADMIN", "ELECTION", "ANNOUNCEMENT"] as const;
const DATE_FILTERS = ["All", "Today", "Last 7 Days", "Last 30 Days"] as const;

function getActionIcon(action: string) {
  const a = action.toUpperCase();
  if (a.includes("LOGIN")) return <Shield className="w-4 h-4 text-success-600" />;
  if (a.includes("VOTE")) return <Vote className="w-4 h-4 text-info-600" />;
  if (a.includes("ANNOUNCE")) return <Megaphone className="w-4 h-4 text-primary-600" />;
  if (a.includes("STUDENT")) return <Users className="w-4 h-4 text-primary-500" />;
  if (a.includes("APPROVE") || a.includes("PUBLISH"))
    return <CheckCircle2 className="w-4 h-4 text-success-600" />;
  if (a.includes("REJECT") || a.includes("FAIL") || a.includes("LOCK"))
    return <AlertCircle className="w-4 h-4 text-error-600" />;
  return <Clock className="w-4 h-4 text-neutral-400" />;
}

function getActionVariant(action: string): "success" | "warning" | "error" | "info" | "neutral" {
  const a = action.toUpperCase();
  if (a.includes("APPROVE") || a.includes("PUBLISH") || a.includes("VOTE_CAST"))
    return "success";
  if (a.includes("REJECT")) return "error";
  if (a.includes("FAIL") || a.includes("LOCK") || a.includes("REQUESTED"))
    return "warning";
  if (a.includes("LOGIN") || a.includes("CREATE") || a.includes("UPDATE"))
    return "info";
  return "neutral";
}

/** Match an event to one of the filter buckets by keyword. */
function matchesEventFilter(action: string, filter: string): boolean {
  if (filter === "All") return true;
  const a = action.toUpperCase();
  switch (filter) {
    case "LOGIN":
      return a.includes("LOGIN") || a.includes("LOGOUT") || a.includes("SESSION");
    case "VOTE":
      return a.includes("VOTE");
    case "ADMIN":
      return a.includes("ADMIN") || a.includes("APPROVE") || a.includes("REJECT") || a.includes("ROLE");
    case "ELECTION":
      return a.includes("ELECTION") || a.includes("CANDIDATE") || a.includes("POSITION");
    case "ANNOUNCEMENT":
      return a.includes("ANNOUNCE");
    default:
      return true;
  }
}

function isWithinDays(ts: string | null, days: number): boolean {
  if (!ts) return false;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return false;
  const diff = Date.now() - d.getTime();
  return diff >= 0 && diff <= days * 86400000;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  useEffect(() => {
    (async () => {
      try {
        const res = await adminApi.getAuditLogs();
        setLogs((res as { logs: AuditLogRecord[] }).logs || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load data. Please try again.");
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = logs;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          (e.user_name || "").toLowerCase().includes(q) ||
          (e.action || "").toLowerCase().includes(q) ||
          JSON.stringify(e.metadata || {})
            .toLowerCase()
            .includes(q)
      );
    }
    result = result.filter((e) => matchesEventFilter(e.action || "", eventFilter));
    if (dateFilter === "Today") {
      const now = new Date();
      result = result.filter((e) => {
        if (!e.created_at) return false;
        const d = new Date(e.created_at);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      });
    } else if (dateFilter === "Last 7 Days") {
      result = result.filter((e) => isWithinDays(e.created_at, 7));
    } else if (dateFilter === "Last 30 Days") {
      result = result.filter((e) => isWithinDays(e.created_at, 30));
    }
    return result;
  }, [logs, search, eventFilter, dateFilter]);

  const describeTarget = (meta: Record<string, unknown> | null): string => {
    if (!meta || typeof meta !== "object") return "—";
    const entries = Object.entries(meta).filter(([, v]) => v !== null && v !== undefined && v !== "");
    if (entries.length === 0) return "—";
    return entries
      .slice(0, 2)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(" • ");
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Activity Log</h1>
          <p className="text-sm text-text-secondary mt-1">
            Administrative activities and audit trail — recorded by the backend.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search activity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white text-text-primary placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                Event Type
              </p>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_FILTERS.map((type) => (
                  <Button
                    key={type}
                    variant={eventFilter === type ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setEventFilter(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Date Range
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DATE_FILTERS.map((range) => (
                  <Button
                    key={range}
                    variant={dateFilter === range ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Activity List */}
        <Card>
          {loading ? (
            <div className="py-16 text-center text-sm text-text-secondary">Loading audit logs…</div>
          ) : error ? (
            <div className="py-16 text-center">
              <AlertCircle className="w-10 h-10 text-error-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-text-secondary">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Clock className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-text-secondary">No Activity Found</p>
              <p className="text-xs text-neutral-400 mt-1">
                {logs.length === 0
                  ? "Administrative actions will be recorded here as they happen."
                  : "Try adjusting your filters or search query."}
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-0">
                {filtered.map((entry, i) => (
                  <div key={entry.id ?? i} className="relative flex gap-4 group">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex-shrink-0 mt-1">
                      <div className="w-[10px] h-[10px] rounded-full bg-primary-500 ring-4 ring-white" />
                    </div>

                    {/* Content */}
                    <div
                      className={`flex-1 min-w-0 ${
                        i < filtered.length - 1 ? "pb-5 border-b border-border" : ""
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-text-primary tracking-wide">
                            {entry.created_at ? new Date(entry.created_at).toLocaleString() : "—"}
                          </p>
                          <p className="text-sm text-text-secondary mt-0.5">
                            <span className="font-medium text-text-primary">
                              {entry.user_name || "System"}
                            </span>
                            {entry.user_role ? ` (${entry.user_role})` : ""} —{" "}
                            <span className="inline-flex items-center gap-1 font-medium text-text-primary">
                              {getActionIcon(entry.action || "")}
                              {entry.action}
                            </span>
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5 truncate">
                            {describeTarget(entry.metadata)}
                            {entry.ip_address ? ` • IP ${entry.ip_address}` : ""}
                          </p>
                        </div>
                        <Badge variant={getActionVariant(entry.action || "")} size="sm">
                          {entry.user_role || "system"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
