"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { ErrorState } from "@/components/ui/ErrorState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { adminApi, type AdminStats, type AuditLogRecord } from "@/lib/api/admin";
import {
  Users,
  BarChart3,
  Vote,
  CheckCircle2,
  Clock,
  ArrowRight,
  Megaphone,
  AlertCircle,
  UserCheck,
  Shield,
  Eye,
  TrendingUp,
  Settings,
  Inbox,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [s, logs] = await Promise.all([
          adminApi.getStats(),
          adminApi.getAuditLogs().catch(() => ({ logs: [] })),
        ]);
        setStats(s as AdminStats);
        setActivities(((logs as { logs?: AuditLogRecord[] }).logs || []).slice(0, 5));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load data. Please try again.");
      }
      setLoading(false);
    })();
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
      value: eligibleStudents.toLocaleString(),
      icon: Users,
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      label: "Candidates",
      value: stats.candidates.total.toLocaleString(),
      icon: UserCheck,
      color: "text-success-600",
      bg: "bg-success-50",
    },
    {
      label: "Elections",
      value: stats.elections.total.toLocaleString(),
      icon: BarChart3,
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      label: "Votes Cast",
      value: ballotsSubmitted.toLocaleString(),
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
            <p className="text-text-secondary mt-1">
              Live database statistics for your elections.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
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
                  <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                  <p className="text-sm text-text-secondary">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

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
                <p className="text-xl font-bold text-text-primary">{eligibleStudents.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Ballots Submitted</p>
                <p className="text-xl font-bold text-text-primary">{ballotsSubmitted.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Unique Voters</p>
                <p className="text-xl font-bold text-text-primary">{stats.votes.unique_voters.toLocaleString()}</p>
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
                  className="bg-primary-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Number(participationRate))}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-text-muted mt-3">
              Generated {new Date(stats.generatedAt).toLocaleString()} — live from PostgreSQL.
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
                    <CheckCircle2 className="h-4 w-4 text-success-500" />
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
