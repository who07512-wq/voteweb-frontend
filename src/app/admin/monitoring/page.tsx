"use client";

import { useEffect, useRef, useState } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { ErrorState } from "@/components/ui/ErrorState";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { adminApi, type MonitoringSummary } from "@/lib/api/admin";
import {
  Gauge,
  Cpu,
  MemoryStick,
  Activity,
  Database,
  ShieldCheck,
  Vote,
  Users,
  LogIn,
  Inbox,
  Server,
} from "lucide-react";

const POLL_INTERVAL_MS = 5000;

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface StatTileProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

function StatTile({ label, value, icon: Icon, color, bg }: StatTileProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight text-text-primary truncate">{value}</p>
        <p className="text-xs text-text-secondary truncate">{label}</p>
      </div>
    </div>
  );
}

export default function AdminMonitoringPage() {
  const [summary, setSummary] = useState<MonitoringSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async (silent = false) => {
    try {
      const data = await adminApi.getMonitoring();
      setSummary(data);
      setLastUpdated(new Date());
      setError("");
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : "Unable to load monitoring data. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await load();
    })();
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  useEffect(() => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  if (loading)
    return (
      <AdminLayout>
        <div className="p-8 text-center text-text-secondary">Loading monitoring…</div>
      </AdminLayout>
    );

  if (error || !summary)
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto w-full px-4 pt-6">
          <ErrorState
            title="Unable to load monitoring"
            message={error || "No data returned."}
            onRetry={() => window.location.reload()}
          />
        </div>
      </AdminLayout>
    );

  const healthy = summary.status === "healthy";
  const memoryUsagePct =
    summary.process.heapTotalBytes > 0
      ? Math.round((summary.process.heapUsedBytes / summary.process.heapTotalBytes) * 100)
      : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">System Monitoring</h1>
              <Badge variant={healthy ? "success" : "error"}>
                <span className="inline-flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${healthy ? "bg-success-500 animate-live-pulse" : "bg-error-500"}`} />
                  {summary.status.toUpperCase()}
                </span>
              </Badge>
            </div>
            <p className="text-text-secondary mt-1">
              Aggregate process, HTTP, database and business metrics — auto-refreshes every {POLL_INTERVAL_MS / 1000}s.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {lastUpdated && (
              <span className="text-xs text-text-muted">Updated {lastUpdated.toLocaleTimeString()}</span>
            )}
            <Badge variant={summary.metricsEnabled ? "success" : "warning"}>
              {summary.metricsEnabled ? "Prometheus scrape enabled" : "Prometheus scrape disabled"}
            </Badge>
            <Badge variant="neutral">Node {summary.nodeVersion}</Badge>
          </div>
        </div>

        {/* System health summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <StatTile
              label="Uptime"
              value={formatUptime(summary.uptimeSeconds)}
              icon={Server}
              color="text-primary-600"
              bg="bg-primary-50"
            />
          </Card>
          <Card className="p-4">
            <StatTile
              label="CPU (last sample)"
              value={summary.process.cpuPercent === null ? "—" : `${summary.process.cpuPercent}%`}
              icon={Cpu}
              color="text-primary-600"
              bg="bg-primary-50"
            />
          </Card>
          <Card className="p-4">
            <StatTile
              label="Memory (RSS)"
              value={formatBytes(summary.process.memoryRssBytes)}
              icon={MemoryStick}
              color="text-success-600"
              bg="bg-success-50"
            />
          </Card>
          <Card className="p-4">
            <StatTile
              label="Heap Used"
              value={`${formatBytes(summary.process.heapUsedBytes)} (${memoryUsagePct}%)`}
              icon={MemoryStick}
              color="text-success-600"
              bg="bg-success-50"
            />
          </Card>
          <Card className="p-4">
            <StatTile
              label="HTTP / s"
              value={String(summary.http.requestsPerSecond)}
              icon={Activity}
              color="text-warning-600"
              bg="bg-warning-50"
            />
          </Card>
          <Card className="p-4">
            <StatTile
              label="Error Rate"
              value={`${summary.http.errorRatePct}%`}
              icon={ShieldCheck}
              color={summary.http.errorRatePct > 5 ? "text-error-600" : "text-success-600"}
              bg={summary.http.errorRatePct > 5 ? "bg-error-50" : "bg-success-50"}
            />
          </Card>
        </div>

        {/* HTTP + Database */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-primary-50">
                <Activity className="h-5 w-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">HTTP Requests</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-xs text-text-secondary">Total Requests</p>
                <p className="text-xl font-bold text-text-primary">{summary.http.requestsTotal.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-xs text-text-secondary">Active Now</p>
                <p className="text-xl font-bold text-text-primary">{summary.http.active}</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-xs text-text-secondary">Avg Duration</p>
                <p className="text-xl font-bold text-text-primary">{formatDuration(summary.http.averageDurationMs)}</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-xs text-text-secondary">Errors (5xx)</p>
                <p className={`text-xl font-bold ${summary.http.errorCount > 0 ? "text-error-600" : "text-text-primary"}`}>
                  {summary.http.errorCount.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-4">
              Based on {summary.http.samples.toLocaleString()} request sample(s) since the process started.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-success-50">
                <Database className="h-5 w-5 text-success-600" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Database Pool</h3>
              <Badge variant={summary.database.connected ? "success" : "error"}>
                {summary.database.connected ? "CONNECTED" : "DOWN"}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-xs text-text-secondary">Total</p>
                <p className="text-xl font-bold text-text-primary">{summary.database.total}</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-xs text-text-secondary">Idle</p>
                <p className="text-xl font-bold text-text-primary">{summary.database.idle}</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-xs text-text-secondary">Waiting</p>
                <p className="text-xl font-bold text-text-primary">{summary.database.waiting}</p>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-4">
              Reuses the application&apos;s single pg connection pool (no separate pool is opened for monitoring).
            </p>
          </Card>
        </div>

        {/* Business metrics */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-warning-50">
              <Gauge className="h-5 w-5 text-warning-600" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Election Activity</h3>
            <p className="text-xs text-text-muted ml-auto hidden sm:block">
              Aggregate session totals since the last restart
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatTile
              label="Live Elections"
              value={String(summary.business.activeElections)}
              icon={Vote}
              color="text-primary-600"
              bg="bg-primary-50"
            />
            <StatTile
              label="Students Registered"
              value={summary.business.registeredStudents.toLocaleString()}
              icon={Users}
              color="text-primary-600"
              bg="bg-primary-50"
            />
            <StatTile
              label="Votes Cast"
              value={summary.business.votesCast.toLocaleString()}
              icon={Vote}
              color="text-success-600"
              bg="bg-success-50"
            />
            <StatTile
              label="Candidate Applications"
              value={summary.business.candidateApplications.toLocaleString()}
              icon={Inbox}
              color="text-success-600"
              bg="bg-success-50"
            />
            <StatTile
              label="Login Attempts"
              value={summary.business.loginAttempts.toLocaleString()}
              icon={LogIn}
              color="text-warning-600"
              bg="bg-warning-50"
            />
            <StatTile
              label="Failed Logins"
              value={summary.business.failedLogins.toLocaleString()}
              icon={ShieldCheck}
              color={summary.business.failedLogins > 0 ? "text-error-600" : "text-success-600"}
              bg={summary.business.failedLogins > 0 ? "bg-error-50" : "bg-success-50"}
            />
          </div>
        </Card>

        <p className="text-xs text-text-muted">
          This page shows aggregate counts only — no student names, emails, sessions or voting choices are ever exposed.
        </p>
      </div>
    </AdminLayout>
  );
}