"use client";

import React, { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_ACTIVITY_LOG } from "@/lib/admin-dashboard-data";
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Vote,
  Users,
  BarChart3,
} from "lucide-react";

const ACTION_TYPES = [
  "All",
  "Candidate Approved",
  "Announcement Published",
  "Election Updated",
  "Position Created",
  "Issue Resolved",
  "Changes Requested",
  "Candidate Rejected",
] as const;

const DATE_FILTERS = ["All", "Today", "Last 7 Days", "Last 30 Days"] as const;

function getActionIcon(action: string) {
  switch (action) {
    case "Candidate Approved":
      return <CheckCircle2 className="w-4 h-4 text-success-600" />;
    case "Announcement Published":
      return <Megaphone className="w-4 h-4 text-primary-600" />;
    case "Election Updated":
      return <Vote className="w-4 h-4 text-info-600" />;
    case "Position Created":
      return <Users className="w-4 h-4 text-primary-500" />;
    case "Issue Resolved":
      return <AlertCircle className="w-4 h-4 text-success-600" />;
    case "Changes Requested":
      return <Clock className="w-4 h-4 text-warning-600" />;
    case "Candidate Rejected":
      return <BarChart3 className="w-4 h-4 text-error-600" />;
    default:
      return <Clock className="w-4 h-4 text-neutral-400" />;
  }
}

function parseTimestamp(ts: string): Date {
  const parts = ts.replace("•", "").trim().split(/\s+/);
  const day = parseInt(parts[0], 10);
  const monthStr = parts[1];
  const year = parseInt(parts[2], 10);
  const timeStr = parts.slice(3).join(" ");
  const monthMap: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const [time, period] = timeStr.split(/(AM|PM)/i);
  const [hoursStr, minsStr] = time.split(":");
  let hours = parseInt(hoursStr, 10);
  const mins = parseInt(minsStr, 10);
  if (period?.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (period?.toUpperCase() === "AM" && hours === 12) hours = 0;
  return new Date(year, monthMap[monthStr] ?? 0, day, hours, mins);
}

function isWithinDays(ts: string, days: number): boolean {
  const d = parseTimestamp(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return diff >= 0 && diff <= days * 86400000;
}

function getActionVariant(action: string): "success" | "warning" | "error" | "info" | "neutral" {
  switch (action) {
    case "Candidate Approved":
    case "Issue Resolved":
      return "success";
    case "Changes Requested":
      return "warning";
    case "Candidate Rejected":
      return "error";
    case "Election Updated":
    case "Announcement Published":
    case "Position Created":
      return "info";
    default:
      return "neutral";
  }
}

export default function ActivityLogPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  const filtered = useMemo(() => {
    let result = MOCK_ACTIVITY_LOG;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.admin.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          e.target.toLowerCase().includes(q)
      );
    }

    if (actionFilter !== "All") {
      result = result.filter((e) => e.action === actionFilter);
    }

    if (dateFilter === "Today") {
      result = result.filter((e) => {
        const d = parseTimestamp(e.timestamp);
        const now = new Date();
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      });
    } else if (dateFilter === "Last 7 Days") {
      result = result.filter((e) => isWithinDays(e.timestamp, 7));
    } else if (dateFilter === "Last 30 Days") {
      result = result.filter((e) => isWithinDays(e.timestamp, 30));
    }

    return result;
  }, [search, actionFilter, dateFilter]);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Activity Log</h1>
          <p className="text-sm text-text-secondary mt-1">
            View administrative activities and audit trail.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <div className="space-y-4">
            {/* Search */}
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

            {/* Action Type Filter */}
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                Action Type
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ACTION_TYPES.map((type) => (
                  <Button
                    key={type}
                    variant={actionFilter === type ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setActionFilter(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Date Filter */}
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
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Clock className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-text-secondary">No Activity Found</p>
              <p className="text-xs text-neutral-400 mt-1">
                Try adjusting your filters or search query.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-0">
                {filtered.map((entry, i) => (
                  <div
                    key={entry.id}
                    className="relative flex gap-4 group"
                  >
                    {/* Timeline dot */}
                    <div className="relative z-10 flex-shrink-0 mt-1">
                      <div className="w-[10px] h-[10px] rounded-full bg-primary-500 ring-4 ring-white" />
                    </div>

                    {/* Content */}
                    <div
                      className={`flex-1 min-w-0 ${
                        i < filtered.length - 1
                          ? "pb-5 border-b border-border"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-text-primary tracking-wide">
                            {entry.timestamp}
                          </p>
                          <p className="text-sm text-text-secondary mt-0.5">
                            <span className="font-medium text-text-primary">{entry.admin}</span>{" "}
                            performed{" "}
                            <span className="inline-flex items-center gap-1 font-medium text-text-primary">
                              {getActionIcon(entry.action)}
                              {entry.action}
                            </span>
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5 truncate">
                            Target: {entry.target}
                          </p>
                        </div>
                        <Badge variant={getActionVariant(entry.action)} size="sm">
                          {entry.status}
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
