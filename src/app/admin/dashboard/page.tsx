"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { ErrorState } from "@/components/ui/ErrorState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { adminApi, type AdminStats, type AuditLogRecord, type LiveSnapshot } from "@/lib/api/admin";
import {
  Users,
  BarChart3,
  Vote,
  Clock,
  ArrowRight,
  Megaphone,
  AlertCircle,
  UserCheck,
  Shield,
  Settings,
  Inbox,
  Trophy,
  Medal,
  TrendingUp,
  Activity,
} from "lucide-react";

const POLL_INTERVAL_MS = 4000;

/** Re-mounts its children whenever `value` changes so the flash animation re-runs. */
function FlashOnChange({ value, children }: { value: string | number; children: ReactNode }) {
  return (
    <span key={value} className="animate-flash-in inline-block rounded-md px-1 -mx-1 transition-none">
      {children}
    </span>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LiveSnapshot["leaderboard"]>([]);
  const [activities, setActivities] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadLive = async (silent = false) => {
    try {
      const snap = (await adminApi.getLive()) as unknown as LiveSnapshot;
      setStats({ ...snap.stats, generatedAt: snap.generatedAt });
      setLeaderboard(snap.leaderboard || []);
      setLastUpdated(new Date());
      setLiveConnected(true);
      setError("");
    } catch (e) {
      setLiveConnected(false);
      if (!silent) setError(e instanceof Error ? e.message : "Unable to load data. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const [, logs] = await Promise.all([
        loadLive(),
        adminApi.getAuditLogs().catch(() => ({ logs: [] })),
      ]);
      setActivities(((logs as { logs?: AuditLogRecord[] }).logs || []).slice(0, 5));
    })();
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  // Live auto-refresh: keep polling while the tab is visible & focused.
  useEffect(() => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(() => {
      if (document.visibilityState === "visible") loadLive(true);
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  if (loading)
    return (
      <AdminLayout>
        <div className="p-8 text-center text-text-secondary">Loading dashboard…</div>
      </AdminLayout>
    );

  if (error || !stats)
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto w-full px-4 pt-6">
          <ErrorState
            title="Unable to load dashboard"
            message={error || "No data returned."}
            onRetry={() => window.location.reload()}
          />
        </div>
      </AdminLayout>
    );

  const eligibleStudents = stats.students.voting_eligible ?? stats.students.total;
  const ballotsSubmitted = stats.votes.total;
  const participationRate =
    eligibleStudents > 0 ? ((ballotsSubmitted / eligibleStudents) * 100).toFixed(1) : "0.0";
  const remaining = Math.max(0, eligibleStudents - ballotsSubmitted);

  const statCards = [
    {
      label: "Eligible Students",
      value: eligibleStudents,
      display: eligibleStudents.toLocaleString(),
      icon: Users,
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      label: "Candidates",
      value: stats.candidates.total,
      display: stats.candidates.total.toLocaleString(),
      icon: UserCheck,
      color: "text-success-600",
      bg: "bg-success-50",
    },
    {
      label: "Elections",
      value: stats.elections.total,
      display: stats.elections.total.toLocaleString(),
      icon: BarChart3,
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      label: "Votes Cast",
      value: ballotsSubmitted,
      display: ballotsSubmitted.toLocaleString(),
      icon: Vote,
      color: "text-success-600",
      bg: "bg-success-50",
    },
  ];

  const quickActions = [
    {
      title: "Review Candidates",
      description: `${stats.pendingCandidateApplications} pending application(s)`,
      icon: UserCheck,
      href: "/admin/candidates",
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      title: "Manage Students",
      description: `${stats.students.total} registered student account(s)`,
      icon: Users,
      href: "/admin/students",
      color: "text-success-600",
      bg: "bg-success-50",
    },
    {
      title: "Access Requests",
      description: `${stats.accessRequests.pending} pending request(s)`,
      icon: Shield,
      href: "/admin/access-requests",
      color: "text-warning-600",
      bg: "bg-warning-50",
    },
    {
      title: "Create Announcement",
      description: "Post announcements to all students",
      icon: Megaphone,
      href: "/admin/announcements",
      color: "text-warning-600",
      bg: "bg-warning-50",
    },
    {
      title: "View Issues",
      description: "Review reported issues and complaints",
      icon: AlertCircle,
      href: "/admin/issues",
      color: "text-error-600",
      bg: "bg-error-50",
    },
    {
      title: "Manage Elections",
      description: `${stats.elections.open} open election(s)`,
      icon: Settings,
      href: "/admin/election",
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
  ];

  const topElection =
    leaderboard.length > 0 ? leaderboard[0].election_name : "—";

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
              <Badge variant={liveConnected ? "success" : "neutral"}>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      liveConnected ? "bg-success-500 animate-live-pulse" : "bg-text-muted"
                    }`}
                  />
                  LIVE
                </span>
              </Badge>
            </div>
            <p className="text-text-secondary mt-1">
              Real-time database statistics — auto-refreshes every {POLL_INTERVAL_MS / 1000}s.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {lastUpdated && (
              <span className="text-xs text-text-muted flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Badge variant={stats.elections.open > 0 ? "success" : "neutral"}>
              {stats.elections.open > 0 ? `${stats.elections.open} Election(s) Open` : "No Open Elections"}
            </Badge>
            <a href="/admin/election">
              <Button variant="primary" className="gap-1.5">
                Manage Elections
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <FlashOnChange value={stat.value}>
                    <p className="text-2xl font-bold text-text-primary">{stat.display}</p>
                  </FlashOnChange>
                  <p className="text-sm text-text-secondary">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Live Leaderboard */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning-50">
                <Trophy className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Live Leaderboard</h3>
                <p className="text-xs text-text-muted">Top candidates in {topElection}</p>
              </div>
            </div>
            <a href="/admin/results">
              <Button variant="outline" size="sm" className="gap-1.5">
                Full Results
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>

          {leaderboard.length === 0 ? (
            <div className="py-10 text-center">
              <Trophy className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-sm font-medium text-text-secondary">No votes recorded yet</p>
              <p className="text-xs text-text-muted mt-1">
                Vote counts will appear here in real time as students cast ballots.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {leaderboard.slice(0, 5).map((entry, index) => {
                const max = leaderboard[0]?.votes || 1;
                const pct = Math.round((entry.votes / max) * 100);
                const rankIcon =
                  index === 0 ? (
                    <Trophy className="w-5 h-5 text-warning-500" />
                  ) : index === 1 ? (
                    <Medal className="w-5 h-5 text-text-secondary" />
                  ) : index === 2 ? (
                    <Medal className="w-5 h-5 text-orange-400" />
                  ) : null;
                return (
                  <div key={entry.candidate_id} className="flex items-center gap-4">
                    <div className="w-8 flex-shrink-0 text-center">
                      {rankIcon || (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-text-primary truncate">
                          {entry.candidate_name}
                          <span className="text-xs text-text-muted font-normal ml-2">
                            {entry.position_name}
                            {entry.scope_name ? ` · ${entry.scope_name}` : ""}
                          </span>
                        </span>
                        <FlashOnChange value={entry.votes}>
                          <span className="text-sm font-bold text-text-primary">{entry.votes} votes</span>
                        </FlashOnChange>
                      </div>
                      <div className="w-full bg-border rounded-full h-2.5">
                        <div
                          className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Participation & Queues Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Participation Card */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary-50">
                <TrendingUp className="h-5 w-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Election Participation</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Eligible</p>
                <FlashOnChange value={eligibleStudents}>
                  <p className="text-xl font-bold text-text-primary">{eligibleStudents.toLocaleString()}</p>
                </FlashOnChange>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Ballots Submitted</p>
                <FlashOnChange value={ballotsSubmitted}>
                  <p className="text-xl font-bold text-text-primary">{ballotsSubmitted.toLocaleString()}</p>
                </FlashOnChange>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Unique Voters</p>
                <FlashOnChange value={stats.votes.unique_voters}>
                  <p className="text-xl font-bold text-text-primary">{stats.votes.unique_voters.toLocaleString()}</p>
                </FlashOnChange>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Remaining</p>
                <p className="text-xl font-bold text-text-primary">{remaining.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Voting Progress</span>
                <span className="font-medium text-text-primary">{participationRate}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Number(participationRate))}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-text-muted mt-3">
              Generated {lastUpdated ? lastUpdated.toLocaleString() : "…"} — live from PostgreSQL.
            </p>
          </Card>

          {/* Queues Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-warning-50">
                <Inbox className="h-5 w-5 text-warning-600" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Pending Queues</h3>
            </div>
            <div className="space-y-4">
              <a href="/admin/access-requests" className="block p-4 bg-warning-50 rounded-lg border border-warning-100 hover:bg-warning-100/60 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-warning-700">Access Requests</span>
                  <Badge variant={stats.accessRequests.pending > 0 ? "warning" : "success"}>
                    {stats.accessRequests.pending}
                  </Badge>
                </div>
                <p className="text-sm text-warning-600 mt-1">Students waiting for approval</p>
              </a>
              <a href="/admin/candidates" className="block p-4 bg-primary-50 rounded-lg border border-primary-100 hover:bg-primary-100/60 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-primary-700">Candidate Applications</span>
                  <Badge variant={stats.pendingCandidateApplications > 0 ? "warning" : "success"}>
                    {stats.pendingCandidateApplications}
                  </Badge>
                </div>
                <p className="text-sm text-primary-600 mt-1">Applications under review</p>
              </a>
              <div className="pt-2">
                <a href="/admin/access-requests" className="w-full">
                  <Button variant="outline" className="w-full gap-1.5">
                    Review Requests
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Card key={action.title} className="p-5 hover:shadow-md transition-shadow">
                <a href={action.href} className="block">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${action.bg}`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-text-primary">{action.title}</h4>
                      <p className="text-sm text-text-secondary mt-1">{action.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-text-muted mt-1 flex-shrink-0" />
                  </div>
                </a>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-50">
                <Clock className="h-5 w-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
            </div>
            <a href="/admin/activity">
              <Button variant="ghost" size="sm" className="gap-1.5">
                View Activity Log
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
          {activities.length === 0 ? (
            <div className="py-10 text-center">
              <Clock className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-sm font-medium text-text-secondary">No activity recorded yet</p>
              <p className="text-xs text-text-muted mt-1">
                Administrative actions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-bg-tertiary transition-colors"
                >
                  <div className="flex-shrink-0">
                    <Trophy className="h-4 w-4 text-success-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">
                      <span className="font-medium">{activity.user_name || "System"}</span>{" "}
                      {activity.action}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {activity.metadata && typeof activity.metadata === "object"
                        ? Object.entries(activity.metadata)
                            .filter(([, v]) => v !== null && v !== undefined)
                            .slice(0, 2)
                            .map(([k, v]) => `${k}: ${String(v)}`)
                            .join(" • ") || "—"
                        : "—"}
                    </p>
                  </div>
                  <span className="text-xs text-text-muted flex-shrink-0">
                    {activity.created_at ? new Date(activity.created_at).toLocaleString() : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}