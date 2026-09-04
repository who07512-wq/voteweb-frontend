"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { adminApi, SupportRequestRecord } from "@/lib/api/admin";
import { Inbox, AlertTriangle, RefreshCw } from "lucide-react";

const STATUS_VARIANT: Record<string, "warning" | "success" | "error" | "neutral" | "info"> = {
  open: "warning",
  in_review: "info",
  pending: "warning",
  resolved: "success",
  closed: "neutral",
  rejected: "error",
};

/**
 * Reported Issues — now reads the REAL support requests API
 * (GET /admin/support). The old version rendered mock issues.
 */
export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<SupportRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getIssues();
      const list = Array.isArray(res) ? res : res.requests || [];
      setIssues(list);
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
          <h1 className="text-2xl font-bold text-text-primary">Reported Issues</h1>
          <p className="text-sm text-text-secondary mt-1">Support requests submitted by students and candidates.</p>
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

      {!loading && issues.length === 0 && !error ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16">
            <Inbox className="h-12 w-12 text-text-tertiary mb-3" />
            <p className="text-text-secondary font-medium">No reported issues found.</p>
            <p className="text-sm text-text-tertiary mt-1">
              Student and candidate support requests will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-semibold text-text-primary py-3 px-4">ID</th>
                  <th className="text-left font-semibold text-text-primary py-3 px-4">Subject</th>
                  <th className="text-left font-semibold text-text-primary py-3 px-4">Category</th>
                  <th className="text-left font-semibold text-text-primary py-3 px-4">Status</th>
                  <th className="text-left font-semibold text-text-primary py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-b-0 hover:bg-primary-50/40">
                    <td className="py-3 px-4 font-mono text-xs text-text-primary">SUP-{String(i.id).padStart(5, "0")}</td>
                    <td className="py-3 px-4 text-text-primary">{String(i.subject || i.message || "—").slice(0, 60)}</td>
                    <td className="py-3 px-4 text-text-secondary">{i.category || "—"}</td>
                    <td className="py-3 px-4">
                      <Badge variant={STATUS_VARIANT[String(i.status || "open").toLowerCase()] || "neutral"}>
                        {String(i.status || "open")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                      {i.created_at ? new Date(String(i.created_at)).toLocaleDateString("en-IN") : "—"}
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
