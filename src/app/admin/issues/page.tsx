"use client";

import React, { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_ISSUES, ISSUE_STATUS_MAP } from "@/lib/admin-dashboard-data";
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

const ISSUE_STATUSES = ["all", "open", "in_review", "waiting", "resolved", "closed"] as const;
const ISSUE_CATEGORIES = [
  "all",
  "Login",
  "Voting",
  "Receipt",
  "Candidate",
  "Technical",
  "Account",
  "Other",
] as const;

const STATUS_LABELS: Record<string, string> = {
  all: "All",
  open: "Open",
  in_review: "In Review",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed",
};

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  Login: "Login",
  Voting: "Voting",
  Receipt: "Receipt",
  Candidate: "Candidate",
  Technical: "Technical",
  Account: "Account",
  Other: "Other",
};

interface TimelineEvent {
  label: string;
  time: string;
  done: boolean;
}

export default function AdminIssuesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const filteredIssues = useMemo(() => {
    return MOCK_ISSUES.filter((issue) => {
      const matchesSearch =
        searchQuery === "" ||
        issue.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.submittedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || issue.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || issue.category.includes(categoryFilter);

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchQuery, statusFilter, categoryFilter]);

  const selectedIssueData = MOCK_ISSUES.find((i) => i.id === selectedIssue);

  const getTimeline = (issueId: string): TimelineEvent[] => {
    const timelines: Record<string, TimelineEvent[]> = {
      "SUP-2026-0042": [
        { label: "Submitted", time: "13 Aug 2026 • 9:15 AM", done: true },
        { label: "Assigned to Support", time: "13 Aug 2026 • 9:20 AM", done: true },
        { label: "In Review", time: "—", done: false },
        { label: "Resolved", time: "—", done: false },
      ],
      "SUP-2026-0041": [
        { label: "Submitted", time: "12 Aug 2026 • 2:30 PM", done: true },
        { label: "Assigned to Admin", time: "12 Aug 2026 • 2:35 PM", done: true },
        { label: "In Review", time: "12 Aug 2026 • 3:00 PM", done: true },
        { label: "Resolved", time: "—", done: false },
      ],
      "SUP-2026-0040": [
        { label: "Submitted", time: "11 Aug 2026 • 11:00 AM", done: true },
        { label: "Assigned to Support", time: "11 Aug 2026 • 11:05 AM", done: true },
        { label: "In Review", time: "11 Aug 2026 • 11:30 AM", done: true },
        { label: "Resolved", time: "12 Aug 2026 • 2:30 PM", done: true },
      ],
      "SUP-2026-0039": [
        { label: "Submitted", time: "10 Aug 2026 • 10:00 AM", done: true },
        { label: "Assigned to Support", time: "10 Aug 2026 • 10:05 AM", done: true },
        { label: "In Review", time: "10 Aug 2026 • 11:00 AM", done: true },
        { label: "Waiting for User", time: "11 Aug 2026 • 9:00 AM", done: true },
        { label: "Resolved", time: "—", done: false },
      ],
      "SUP-2026-0038": [
        { label: "Submitted", time: "10 Aug 2026 • 8:30 AM", done: true },
        { label: "Assigned to Admin", time: "10 Aug 2026 • 8:35 AM", done: true },
        { label: "In Review", time: "10 Aug 2026 • 9:00 AM", done: true },
        { label: "Resolved", time: "10 Aug 2026 • 11:00 AM", done: true },
      ],
    };
    return (
      timelines[issueId] || [
        { label: "Submitted", time: "—", done: false },
        { label: "Assigned", time: "—", done: false },
        { label: "In Review", time: "—", done: false },
        { label: "Resolved", time: "—", done: false },
      ]
    );
  };

  const handleSendResponse = () => {
    if (!responseText.trim()) return;
    setResponseText("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Reported Issues
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage and respond to reported issues.
          </p>
        </div>

        {/* Filters Bar */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
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

            {/* Status Filter */}
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

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
              >
                {ISSUE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Issues Table - Desktop */}
        <Card className="hidden md:block">
          {filteredIssues.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-semibold text-text-primary py-3 px-4">
                      Request ID
                    </th>
                    <th className="text-left font-semibold text-text-primary py-3 px-4">
                      Category
                    </th>
                    <th className="text-left font-semibold text-text-primary py-3 px-4">
                      Submitted By
                    </th>
                    <th className="text-left font-semibold text-text-primary py-3 px-4">
                      Date
                    </th>
                    <th className="text-left font-semibold text-text-primary py-3 px-4">
                      Status
                    </th>
                    <th className="text-left font-semibold text-text-primary py-3 px-4">
                      Assigned To
                    </th>
                    <th className="text-right font-semibold text-text-primary py-3 px-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((issue) => {
                    const statusInfo = ISSUE_STATUS_MAP[issue.status] || {
                      label: issue.status,
                      variant: "neutral",
                    };
                    return (
                      <tr
                        key={issue.id}
                        className="border-b border-border last:border-b-0 hover:bg-primary-50/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-xs font-medium text-text-primary">
                          {issue.id}
                        </td>
                        <td className="py-3 px-4 text-text-secondary">
                          {issue.category}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-text-primary">
                              {issue.submittedBy}
                            </p>
                            <p className="text-xs text-text-tertiary">
                              {issue.role}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-text-secondary">
                          {issue.submittedDate}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              statusInfo.variant as
                                | "default"
                                | "success"
                                | "warning"
                                | "error"
                                | "info"
                                | "neutral"
                            }
                          >
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-text-secondary">
                          {issue.assignedTo}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedIssue(issue.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-12 w-12 text-text-tertiary mb-3" />
              <p className="text-text-secondary font-medium">
                No Reported Issues
              </p>
              <p className="text-sm text-text-tertiary mt-1">
                All reported issues will appear here.
              </p>
            </div>
          )}
        </Card>

        {/* Issues Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => {
              const statusInfo = ISSUE_STATUS_MAP[issue.status] || {
                label: issue.status,
                variant: "neutral",
              };
              return (
                <Card key={issue.id}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-xs font-medium text-text-primary">
                      {issue.id}
                    </span>
                    <Badge
                      variant={
                        statusInfo.variant as
                          | "default"
                          | "success"
                          | "warning"
                          | "error"
                          | "info"
                          | "neutral"
                      }
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-primary font-medium mb-1">
                    {issue.category}
                  </p>
                  <p className="text-sm text-text-secondary mb-2">
                    {issue.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-text-primary">
                        {issue.submittedBy}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {issue.submittedDate}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedIssue(issue.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="h-12 w-12 text-text-tertiary mb-3" />
                <p className="text-text-secondary font-medium">
                  No Reported Issues
                </p>
                <p className="text-sm text-text-tertiary mt-1">
                  All reported issues will appear here.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Issue Detail Panel - Modal Overlay */}
      {selectedIssue && selectedIssueData && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setSelectedIssue(null);
              setResponseText("");
            }}
          />

          {/* Panel */}
          <div className="relative ml-auto w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 space-y-6">
              {/* Panel Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-sm font-semibold text-text-primary">
                    {selectedIssueData.id}
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {selectedIssueData.category}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedIssue(null);
                    setResponseText("");
                  }}
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
                <p className="text-sm text-text-primary leading-relaxed">
                  {selectedIssueData.description}
                </p>
              </Card>

              {/* Submitted By & Date */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                    Submitted By
                  </p>
                  <p className="text-sm font-medium text-text-primary">
                    {selectedIssueData.submittedBy}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {selectedIssueData.role}
                  </p>
                </Card>
                <Card>
                  <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                    Date
                  </p>
                  <p className="text-sm font-medium text-text-primary">
                    {selectedIssueData.submittedDate}
                  </p>
                </Card>
              </div>

              {/* Status */}
              <Card>
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                  Status
                </p>
                <Badge
                  variant={
                    (ISSUE_STATUS_MAP[selectedIssueData.status]?.variant as any) ||
                    "neutral"
                  }
                  size="md"
                >
                  {ISSUE_STATUS_MAP[selectedIssueData.status]?.label ||
                    selectedIssueData.status}
                </Badge>
              </Card>

              {/* Support Timeline */}
              <Card>
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                  Support Timeline
                </p>
                <div className="space-y-0">
                  {getTimeline(selectedIssueData.id).map((event, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 relative"
                    >
                      {/* Connector line */}
                      {index <
                        getTimeline(selectedIssueData.id).length - 1 && (
                        <div className="absolute left-[7px] top-5 w-0.5 h-full bg-border" />
                      )}
                      {/* Dot */}
                      <div className="relative mt-1 flex-shrink-0">
                        {event.done ? (
                          <CheckCircle2 className="h-4 w-4 text-success-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-text-tertiary" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="pb-4">
                        <p
                          className={`text-sm font-medium ${
                            event.done
                              ? "text-text-primary"
                              : "text-text-tertiary"
                          }`}
                        >
                          {event.label}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {event.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Admin Response Section */}
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
                    onClick={handleSendResponse}
                    disabled={!responseText.trim()}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Send Response
                  </Button>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {selectedIssueData.status !== "in_review" &&
                  selectedIssueData.status !== "resolved" &&
                  selectedIssueData.status !== "closed" && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Clock className="h-4 w-4 mr-1" />
                      Mark In Review
                    </Button>
                  )}
                {selectedIssueData.status !== "resolved" &&
                  selectedIssueData.status !== "closed" && (
                    <Button variant="primary" size="sm" className="flex-1">
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
