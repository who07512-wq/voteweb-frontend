"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { adminApi } from "@/lib/api/admin";
import { Users, Vote, UserCheck, CheckSquare, Clock, Inbox, AlertTriangle } from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof adminApi.getStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setStats(await adminApi.getStats());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load data. Please try again.");
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

  if (error || !stats) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-error-500 mx-auto mb-3" />
        <p className="text-text-primary font-medium">Unable to load dashboard</p>
        <p className="text-sm text-text-secondary">{error || "No data returned."}</p>
      </div>
    );
  }

  const cards = [
    { label: "Total Students", value: stats.students.total, sub: `${stats.students.active} active`, icon: Users },
    { label: "Elections", value: stats.elections.total, sub: `${stats.elections.open} open`, icon: Vote },
    { label: "Candidates", value: stats.candidates.total, sub: "active", icon: UserCheck },
    { label: "Votes Cast", value: stats.votes.total, sub: `${stats.votes.unique_voters} voters`, icon: CheckSquare },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">Live database statistics.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-text-primary">{c.value}</p>
                <p className="text-sm font-medium text-text-secondary mt-1">{c.label}</p>
                <p className="text-xs text-text-tertiary">{c.sub}</p>
              </div>
              <c.icon className="h-8 w-8 text-primary-200" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <Clock className="h-8 w-8 text-warning-500" />
          <div>
            <p className="text-2xl font-bold text-text-primary">{stats.accessRequests.pending}</p>
            <p className="text-sm text-text-secondary">Pending access requests</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <Inbox className="h-8 w-8 text-primary-500" />
          <div>
            <p className="text-2xl font-bold text-text-primary">{stats.pendingCandidateApplications}</p>
            <p className="text-sm text-text-secondary">Pending candidate applications</p>
          </div>
        </Card>
      </div>

      {stats.students.total === 0 && (
        <Card className="p-6 text-center">
          <p className="text-text-secondary font-medium">No students are registered yet.</p>
          <p className="text-sm text-text-tertiary mt-1">
            Students appear here after they sign in (invite-only) or are approved via access requests.
          </p>
        </Card>
      )}
    </div>
  );
}
