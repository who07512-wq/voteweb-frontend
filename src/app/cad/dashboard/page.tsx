"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api/client";
import {
  Vote,
  Users,
  CheckSquare,
  UserCheck,
  Activity,
  RefreshCw,
  AlertTriangle,
  Inbox,
} from "lucide-react";

interface Overview {
  elections: { total: number; open: number; closed: number };
  students: { total: number; active: number; voting_eligible: number };
  votes: { total: number; voters: number };
  candidates: { total: number };
  pendingAccessRequests: number;
  liveElection: {
    id: number;
    name: string;
    status: string;
    startTime: string | null;
    endTime: string | null;
    turnout: { eligibleVoters: number; studentsVoted: number; participationPct: number } | null;
  } | null;
  generatedAt: string;
}

/**
 * CAD Dashboard — live election overview (election monitor).
 * All numbers come from GET /cad/overview (real PostgreSQL counts).
 */
export default function CadDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get<Overview>("/cad/overview");
      setData(res);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load data. Please try again.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000); // live monitoring: refresh every 15s
    return () => clearInterval(t);
  }, [load]);

  if (loading) {
    return (
      <div className="p-8 text-center text-text-secondary">Loading...</div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-error-500 mx-auto mb-3" />
        <p className="text-text-primary font-medium mb-1">Unable to load data</p>
        <p className="text-sm text-text-secondary">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { label: "Elections", value: data.elections.total, sub: `${data.elections.open} open`, icon: Vote },
    { label: "Students", value: data.students.total, sub: `${data.students.active} active`, icon: Users },
    { label: "Votes cast", value: data.votes.total, sub: `${data.votes.voters} voters`, icon: CheckSquare },
    { label: "Candidates", value: data.candidates.total, sub: "active", icon: UserCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Election Monitor</h1>
          <p className="text-sm text-text-secondary mt-1">
            Live overview — auto-refreshes every 15 seconds.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-xl hover:bg-primary-50 transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-text-primary">{s.value}</p>
                <p className="text-sm font-medium text-text-secondary mt-1">{s.label}</p>
                <p className="text-xs text-text-tertiary">{s.sub}</p>
              </div>
              <s.icon className="h-8 w-8 text-primary-200" />
            </div>
          </Card>
        ))}
      </div>

      {/* Live election */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary-600" />
          <h2 className="font-semibold text-text-primary">Live Election</h2>
        </div>
        {!data.liveElection ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Inbox className="h-10 w-10 text-text-tertiary mb-2" />
            <p className="text-text-secondary font-medium">No elections are currently open.</p>
            <p className="text-sm text-text-tertiary mt-1">
              When an election opens, live turnout will appear here.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <p className="text-lg font-semibold text-text-primary">{data.liveElection.name}</p>
              <Badge variant="success">{data.liveElection.status}</Badge>
            </div>
            {data.liveElection.turnout && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-text-primary">{data.liveElection.turnout.eligibleVoters}</p>
                  <p className="text-xs text-text-tertiary">Eligible voters</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{data.liveElection.turnout.studentsVoted}</p>
                  <p className="text-xs text-text-tertiary">Have voted</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-600">{data.liveElection.turnout.participationPct}%</p>
                  <p className="text-xs text-text-tertiary">Participation</p>
                </div>
              </div>
            )}
            <div className="mt-4">
              <Link href="/cad/results" className="text-sm text-primary-600 hover:text-primary-700 hover:underline">
                View live results →
              </Link>
            </div>
          </div>
        )}
      </Card>

      {error && data && (
        <p className="text-xs text-warning-600">
          Refresh failed: {error} — showing last successful data.
        </p>
      )}
    </div>
  );
}
