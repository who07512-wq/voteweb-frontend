"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { ErrorState } from "@/components/ui/ErrorState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  MOCK_ADMIN_ELECTION,
  MOCK_ADMIN_CANDIDATES,
  MOCK_ACTIVITY_LOG,
} from "@/lib/admin-dashboard-data";
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
} from "lucide-react";

export default function AdminDashboardPage() {
  const [error, setError] = useState<string | null>(null);
  const eligibleStudents = 2846;
  const ballotsSubmitted = 1742;
  const participationRate = ((ballotsSubmitted / eligibleStudents) * 100).toFixed(1);
  const remaining = eligibleStudents - ballotsSubmitted;

  const stats = [
    {
      label: "Eligible Students",
      value: "2,846",
      icon: Users,
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      label: "Candidates",
      value: "24",
      icon: UserCheck,
      color: "text-success-600",
      bg: "bg-success-50",
    },
    {
      label: "Positions",
      value: "6",
      icon: BarChart3,
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      label: "Voting Status",
      value: "Open",
      icon: Vote,
      color: "text-success-600",
      bg: "bg-success-50",
    },
  ];

  const quickActions = [
    {
      title: "Review Candidates",
      description: "Review and approve candidate applications",
      icon: UserCheck,
      href: "/admin/candidates",
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      title: "Manage Students",
      description: "Manage student registrations and eligibility",
      icon: Users,
      href: "/admin/students",
      color: "text-success-600",
      bg: "bg-success-50",
    },
    {
      title: "Manage Election",
      description: "Configure election settings and dates",
      icon: Settings,
      href: "/admin/election",
      color: "text-primary-600",
      bg: "bg-primary-50",
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
      title: "Manage Positions",
      description: "Add or edit election positions",
      icon: Shield,
      href: "/admin/positions",
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
  ];

  const systemStatuses = [
    { name: "Voting System", status: "Operational" },
    { name: "Authentication", status: "Operational" },
    { name: "Database", status: "Operational" },
    { name: "Results API", status: "Operational" },
    { name: "Notifications", status: "Operational" },
    { name: "File Storage", status: "Operational" },
  ];

  const recentActivities = MOCK_ACTIVITY_LOG.slice(0, 5);

  return (
    <AdminLayout>
      {error && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-6">
          <ErrorState
            title="Something went wrong"
            message={error}
            onRetry={() => setError(null)}
          />
        </div>
      )}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
            <p className="text-text-secondary mt-1">
              Manage and monitor the Student Council Election 2026.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="success">Voting Open</Badge>
            <a href="/admin/election">
              <Button variant="primary" className="gap-1.5">
                Manage Election
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>

        {/* Election Overview Card */}
        <Card className="p-6 border-l-4 border-l-primary-600">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Student Council Election 2026
              </h2>
              <p className="text-sm text-text-secondary">Complete election overview</p>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-text-muted" />
              <span className="text-sm text-text-secondary">Overview</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <p className="text-sm text-text-secondary">Status</p>
              <Badge variant="success" className="mt-1">
                Voting Open
              </Badge>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Voting Start</p>
              <p className="font-medium text-text-primary mt-1">Mar 15, 2026</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Voting End</p>
              <p className="font-medium text-text-primary mt-1">Mar 20, 2026</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Positions</p>
              <p className="font-medium text-text-primary mt-1">6</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Candidates</p>
              <p className="font-medium text-text-primary mt-1">24</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Eligible Students</p>
              <p className="font-medium text-text-primary mt-1">2,846</p>
            </div>
          </div>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
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

        {/* Participation & Election Status Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Participation Card */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary-50">
                <TrendingUp className="h-5 w-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                Election Participation
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Eligible</p>
                <p className="text-xl font-bold text-text-primary">2,846</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Ballots Submitted</p>
                <p className="text-xl font-bold text-text-primary">1,742</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Participation</p>
                <p className="text-xl font-bold text-primary-600">
                  {participationRate}%
                </p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-sm text-text-secondary">Remaining</p>
                <p className="text-xl font-bold text-text-primary">
                  {remaining.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Voting Progress</span>
                <span className="font-medium text-text-primary">
                  {participationRate}%
                </span>
              </div>
              <div className="w-full bg-border rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all"
                  style={{ width: `${participationRate}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-text-muted mt-3">Demo election data</p>
          </Card>

          {/* Election Status Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-success-50">
                <CheckCircle2 className="h-5 w-5 text-success-600" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                Election Status
              </h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-success-50 rounded-lg border border-success-100">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-success-500 rounded-full animate-pulse" />
                  <span className="font-medium text-success-600">
                    Voting is currently open
                  </span>
                </div>
                <p className="text-sm text-success-600 mt-1">
                  Students can cast their ballots now
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Current Phase</span>
                  <span className="font-medium text-text-primary">Voting</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Duration</span>
                  <span className="font-medium text-text-primary">5 days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Time Remaining</span>
                  <span className="font-medium text-text-primary">3 days</span>
                </div>
              </div>
              <a href="/admin/election" className="w-full">
                <Button variant="outline" className="w-full gap-1.5">
                  <Settings className="w-4 h-4" />
                  Manage Status
                </Button>
              </a>
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

        {/* Recent Activity & System Status Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-50">
                  <Clock className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">
                  Recent Activity
                </h3>
              </div>
              <a href="/admin/activity">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  View Activity Log
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-bg-tertiary transition-colors"
                >
                  <div className="flex-shrink-0">
                    <Clock className="h-4 w-4 text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{activity.action}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{activity.target}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-text-muted">{activity.timestamp}</span>
                    <Badge
                      variant={
                        activity.status === "success"
                          ? "success"
                          : activity.status === "warning"
                          ? "warning"
                          : "info"
                      }
                    >
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* System Status */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-success-50">
                <Shield className="h-5 w-5 text-success-600" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">System Status</h3>
            </div>
            <div className="space-y-3">
              {systemStatuses.map((system) => (
                <div
                  key={system.name}
                  className="flex items-center justify-between p-2"
                >
                  <span className="text-sm text-text-primary">{system.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-success-500 rounded-full" />
                    <span className="text-xs text-success-600 font-medium">
                      {system.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-4">Demo status</p>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
