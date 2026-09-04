"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { adminApi, AuditLogRecord } from "@/lib/api/admin";
import { Clock, Inbox, AlertTriangle, RefreshCw } from "lucide-react";

const ACTION_VARIANT: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
  clerk_google_login: "info",
  clerk_login_denied: "error",
  access_request_submitted: "info",
  access_request_approved: "success",
  access_request_rejected: "error",
  email_change_approved: "success",
  email_change_rejected: "error",
  vote_cast: "success",
};

function friendlyAction(action: string): string {
  return String(action || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs();
      setLogs(res.logs || []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load data. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Activity Log</h1>
          <p className="text-sm text-text-secondary mt-1">
            Real audit trail: sign-ins, denials, approvals, and admin actions.
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

      {error && (
        <div className="p-3 bg-error-50 border border-error-200 rounded-xl text-error-600 text-sm">
          {error}
        </div>
      )}

      {!loading && logs.length === 0 && !error ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16">
            <Inbox className="h-12 w-12 text-text-tertiary mb-3" />
            <p className="text-text-secondary font-medium">No activity recorded yet.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-semibold text-text-primary py-3 px-4">Time</th>
                  <th className="text-left font-semibold text-text-primary py-3 px-4">Action</th>
                  <th className="text-left font-semibold text-text-primary py-3 px-4">User</th>
                  <th className="text-left font-semibold text-text-primary py-3 px-4">Role</th>
                  <th className="text-left font-semibold text-text-primary py-3 px-4">IP</th>
                  <th className="text-left font-semibold text-text-primary py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={`${l.id}-${l.created_at}`} className="border-b border-border last:border-b-0 hover:bg-primary-50/40">
                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={ACTION_VARIANT[l.action] || "neutral"}>{friendlyAction(l.action)}</Badge>
                    </td>
                    <td className="py-3 px-4 text-text-primary">{l.user_name || "—"}</td>
                    <td className="py-3 px-4 text-text-secondary">{l.user_role || "—"}</td>
                    <td className="py-3 px-4 text-text-secondary font-mono text-xs">{l.ip_address || "—"}</td>
                    <td className="py-3 px-4 text-xs text-text-tertiary max-w-xs truncate">
                      {l.metadata ? JSON.stringify(l.metadata) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
