"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { adminApi } from "@/lib/api/admin";
import {
  Search,
  Filter,
  Eye,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
} from "lucide-react";

/** Minimal, exact row type — no index signature, keeps TS happy everywhere. */
interface IssueRow {
  id: number;
  subject: string | null;
  category: string | null;
  message: string | null;
  status: string | null;
  response: string | null;
  created_at: string | null;
}

const ISSUE_STATUSES = ["all", "open", "in_review", "waiting", "resolved", "closed"] as const;

const STATUS_LABELS: Record<string, string> = {
  all: "All",
  open: "Open",
  in_review: "In Review",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "error" | "info" | "neutral"> = {
  open: "warning",
  in_review: "info",
  waiting: "default",
  resolved: "success",
  closed: "neutral",
};

const STATUS_ORDER = ["open", "in_review", "waiting", "resolved"];

function normalizeIssue(raw: Record<string, unknown>, index: number): IssueRow {
  return {
    id: Number(raw.id ?? index + 1),
    subject: (raw.subject as string) ?? null,
    category: (raw.category as string) ?? null,
    message: (raw.message as string) ?? null,
    status: (raw.status as string) ?? "open",
    response: (raw.response as string) ?? null,
    created_at: (raw.created_at as string) ?? null,
  };
}

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getIssues();
      const rows: Array<Record<string, unknown>> = Array.isArray(res)
        ? (res as Array<Record<string, unknown>>)
        : ((res as { requests?: Array<Record<string, unknown>> }).requests ?? []);
      setIssues(rows.map(normalizeIssue));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load issues. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        String(issue.id).includes(q) ||
        (issue.subject || "").toLowerCase().includes(q) ||
        (issue.category || "").toLowerCase().includes(q) ||
        (issue.message || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [issues, searchQuery, statusFilter]);

  const selectedIssueData: IssueRow | null =
    issues.find((i) => i.id === selectedId) ?? null;

  const handleUpdate = async (update: { status?: string; response?: string }) => {
    if (!selectedId) return;
    setSaving(true);
    setActionError("");
    try {
      await adminApi.updateSupportRequest(selectedId, update);
      await load();
      setResponseText("");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Update failed. Please try again.");
    }
    setSaving(false);
  };

  const closePanel = () => {
    setSelectedId(null);
    setResponseText("");
    setActionError("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reported Issues</h1>
          <p className="text-sm text-text-secondary mt-1">
            Support requests submitted by students — updated live.
          </p>
        </div>

        {/* Filters Bar */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-text-tertiary"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
              >
                {ISSUE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {actionError && (
          <Card className="p-4 flex items-center gap-3 border-error-200 bg-error-50">
            <AlertCircle className="w-5 h-5 text-error-500" />
            <p className="text-sm text-error-600">{actionError}</p>
          </Card>
        )}

        {/* Desktop Table */}
        <Card className="hidden md:block">
          {loading ? (
            <div className="py-16 text-center text-sm text-text-secondary">
              Loading support requests…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-12 w-12 text-error-500 mb-3" />
              <p className="text-text-secondary font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={load} className="mt-3">
                Retry
              </Button>
            </div>
          ) : filteredIssues.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-semibold text-text-primary py-3 px-4">Request ID</th>
                    <th className="text-left font-semibold text-text-primary py-3 px-4">Category</th>
                    <th className="text-left font-semibold text-text-primary py-3 px-4">Subject</th>
                    <th className="text-left font-semibold text-text-primary py-3 px-4">Date</th>
                    <th className="text-left font-semibold text-text-primary py-3 px-4">Status</th>
                    <th className="text-right font-semibold text-text-primary py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((issue) => (
                    <tr
                      key={issue.id}
                      className="border-b border-border last:border-b-0 hover:bg-primary-50/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-xs font-medium text-text-primary">
                        SUP-{String(issue.id).padStart(4, "0")}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{issue.category || "—"}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-text-primary truncate max-w-[240px]">
                          {issue.subject || (issue.message || "—").slice(0, 60)}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={STATUS_VARIANTS[issue.status || "open"] || "neutral"}
                          size="sm"
                        >
                          {STATUS_LABELS[issue.status || "open"] || issue.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedId(issue.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-12 w-12 text-text-tertiary mb-3" />
              <p className="text-text-secondary font-medium">
                {issues.length === 0 ? "No Reported Issues" : "No issues match your filters"}
              </p>
              <p className="text-sm text-text-tertiary mt-1">
                {issues.length === 0
                  ? "Support requests submitted by students will appear here."
                  : "Try adjusting the search or status filter."}
              </p>
            </div>
          )}
        </Card>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <Card className="py-12 text-center text-sm text-text-secondary">Loading…</Card>
          ) : filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => (
              <Card key={issue.id}>
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs font-medium text-text-primary">
                    SUP-{String(issue.id).padStart(4, "0")}
                  </span>
                  <Badge
                    variant={STATUS_VARIANTS[issue.status || "open"] || "neutral"}
                    size="sm"
                  >
                    {STATUS_LABELS[issue.status || "open"] || issue.status}
                  </Badge>
                </div>
                <p className="text-sm text-text-primary font-medium mb-1">
                  {issue.category || "—"}
                </p>
                <p className="text-sm text-text-secondary mb-2">{issue.message || "—"}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-tertiary">
                    {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : ""}
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedId(issue.id)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="h-12 w-12 text-text-tertiary mb-3" />
                <p className="text-text-secondary font-medium">No Reported Issues</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Issue Detail Panel */}
      {selectedIssueData !== null && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closePanel} />

          <div className="relative ml-auto w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Panel Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-sm font-semibold text-text-primary">
                    SUP-{String(selectedIssueData.id).padStart(4, "0")}
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {selectedIssueData.category || "Support request"}
                  </p>
                </div>
                <button
                  onClick={closePanel}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5 text-text-secondary" />
                </button>
              </div>

              {/* Description */}
              <Card>
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                  Description
                </p>
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                  {selectedIssueData.message || "—"}
                </p>
              </Card>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                    Submitted
                  </p>
                  <p className="text-sm font-medium text-text-primary">
                    {selectedIssueData.created_at
                      ? new Date(selectedIssueData.created_at).toLocaleString()
                      : "—"}
                  </p>
                </Card>
                <Card>
                  <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                    Current Status
                  </p>
                  <Badge
                    variant={STATUS_VARIANTS[selectedIssueData.status || "open"] || "neutral"}
                    size="md"
                  >
                    {STATUS_LABELS[selectedIssueData.status || "open"] || selectedIssueData.status}
                  </Badge>
                </Card>
              </div>

              {/* Prior response if any */}
              {selectedIssueData.response !== null && (
                <Card className="border-success-100 bg-success-50/40">
                  <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                    Admin Response
                  </p>
                  <p className="text-sm text-text-primary whitespace-pre-wrap">
                    {selectedIssueData.response}
                  </p>
                </Card>
              )}

              {/* Progress derived from real status */}
              <Card>
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                  Progress
                </p>
                <div className="space-y-0">
                  {STATUS_ORDER.filter(
                    (s) => s !== "waiting" || selectedIssueData.status === "waiting"
                  ).map((stage, index, arr) => {
                    const done =
                      STATUS_ORDER.indexOf(selectedIssueData.status || "open") >=
                        STATUS_ORDER.indexOf(stage) && selectedIssueData.status !== "closed";
                    return (
                      <div key={stage} className="flex items-start gap-3 relative">
                        {index < arr.length - 1 && (
                          <div className="absolute left-[7px] top-5 w-0.5 h-full bg-border" />
                        )}
                        <div className="relative mt-1 flex-shrink-0">
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 text-success-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-text-tertiary" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p
                            className={`text-sm font-medium ${
                              done ? "text-text-primary" : "text-text-tertiary"
                            }`}
                          >
                            {STATUS_LABELS[stage]}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Admin Response */}
              <Card>
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                  Admin Response
                </p>
                <textarea
                  placeholder="Write response..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-text-tertiary resize-none"
                />
                <div className="mt-3">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!responseText.trim() || saving}
                    onClick={() => handleUpdate({ response: responseText.trim() })}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {saving ? "Sending…" : "Save Response"}
                  </Button>
                </div>
              </Card>

              {/* Actions — real status transitions */}
              <div className="flex gap-3">
                {selectedIssueData.status === "open" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={saving}
                    onClick={() => handleUpdate({ status: "in_review" })}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Mark In Review
                  </Button>
                )}
                {selectedIssueData.status !== "resolved" &&
                  selectedIssueData.status !== "closed" && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      disabled={saving}
                      onClick={() => handleUpdate({ status: "resolved" })}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Resolve
                    </Button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
