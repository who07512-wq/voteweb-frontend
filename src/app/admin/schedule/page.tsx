"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { adminApi, type AdminElectionRecord } from "@/lib/api/admin";
import { Calendar, Clock, CheckCircle2, RefreshCw, Inbox, AlertTriangle } from "lucide-react";

interface TimelineEvent {
  id: string;
  event: string;
  date: string;
  time: string;
  description: string;
  status: "Completed" | "In Progress" | "Upcoming";
}

function buildTimeline(elections: AdminElectionRecord[]): TimelineEvent[] {
  const now = Date.now();
  const events: TimelineEvent[] = [];

  for (const e of elections) {
    const start = e.start_time ? new Date(e.start_time).getTime() : null;
    const end = e.end_time ? new Date(e.end_time).getTime() : null;

    const fmt = (iso: string | null) => {
      if (!iso) return "Not set";
      const d = new Date(iso);
      return isNaN(d.getTime())
        ? "Not set"
        : d.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const statusOf = (point: number | null, wasOpen: boolean): "Completed" | "In Progress" | "Upcoming" => {
      if (point === null) return "Upcoming";
      if (point < now) return "Completed";
      if (wasOpen && start !== null && start <= now) return "In Progress";
      return "Upcoming";
    };

    events.push({
      id: `c-${e.id}`,
      event: `${e.name} — Created`,
      date: fmt(e.start_time),
      time: "—",
      description: `Election created (status: ${e.status}). Manage it from Election Management.`,
      status: "Completed",
    });
    events.push({
      id: `s-${e.id}`,
      event: `${e.name} — Voting Opens`,
      date: fmt(e.start_time),
      time: start ? new Date(e.start_time!).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—",
      description: "Eligible students can begin casting their votes.",
      status: statusOf(start, true),
    });
    events.push({
      id: `e-${e.id}`,
      event: `${e.name} — Voting Closes`,
      date: fmt(e.end_time),
      time: end ? new Date(e.end_time!).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—",
      description: "Voting period ends; results can then be published.",
      status: statusOf(end, true),
    });
  }

  return events;
}

export default function AdminSchedulePage() {
  const [elections, setElections] = useState<AdminElectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getElections();
      const rows: AdminElectionRecord[] = Array.isArray(res)
        ? res
        : ((res as { elections?: AdminElectionRecord[] }).elections as AdminElectionRecord[]) ||
          ((res as { data?: AdminElectionRecord[] }).data as AdminElectionRecord[]) ||
          [];
      setElections(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load schedule. Please try again.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const timeline = buildTimeline(elections);

  const statusBadge = (status: string): "success" | "warning" | "neutral" => {
    if (status === "Completed") return "success";
    if (status === "In Progress") return "warning";
    return "neutral";
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Election Schedule</h1>
            <p className="text-sm text-text-secondary">
              Real timeline built from election dates in the database.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="p-4 flex items-center gap-3 border-error-200 bg-error-50">
            <AlertTriangle className="w-5 h-5 text-error-500" />
            <p className="text-sm text-error-600">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card className="p-12 text-center text-text-secondary">Loading schedule…</Card>
        ) : timeline.length === 0 ? (
          <Card className="p-12 text-center">
            <Inbox className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text-primary">No Elections Scheduled</h3>
            <p className="text-sm text-text-secondary mt-1">
              The schedule appears here once an election exists with voting dates.
            </p>
            <Link href="/admin/election" className="inline-block mt-4 text-sm text-primary-600 hover:text-primary-700 font-semibold hover:underline">
              Go to Election Management →
            </Link>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-text-primary">Election Timeline</h2>
            </div>
            <div className="space-y-0">
              {timeline.map((event, idx) => (
                <div key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
                  {/* Timeline line */}
                  {idx < timeline.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                  )}
                  {/* Dot */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                      event.status === "Completed"
                        ? "bg-success-50"
                        : event.status === "In Progress"
                          ? "bg-warning-50"
                          : "bg-bg-tertiary"
                    }`}
                  >
                    {event.status === "Completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-success-600" />
                    ) : (
                      <Clock className={`w-4 h-4 ${event.status === "In Progress" ? "text-warning-600" : "text-text-muted"}`} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="font-semibold text-text-primary">{event.event}</p>
                      <Badge variant={statusBadge(event.status)} size="sm">
                        {event.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {event.date}
                      {event.time !== "—" && ` at ${event.time}`}
                    </p>
                    <p className="text-xs text-text-muted mt-1">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
              <p className="text-xs text-text-muted">Dates are set from Election Management.</p>
              <Link href="/admin/election" className="text-sm text-primary-600 hover:text-primary-700 font-semibold hover:underline">
                Edit dates →
              </Link>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
