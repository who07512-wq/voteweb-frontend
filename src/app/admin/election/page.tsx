"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { adminApi, type AdminElectionRecord } from "@/lib/api/admin";
import {
  Vote,
  Calendar,
  Users,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit,
  RefreshCw,
  Inbox,
} from "lucide-react";

const STATUS_OPTIONS = ["DRAFT", "SCHEDULED", "OPEN", "CLOSED", "PUBLISHED"] as const;

function StatusModal({
  isOpen,
  title,
  message,
  confirmText,
  onConfirm,
  onCancel,
  requiresInput,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  requiresInput?: boolean;
}) {
  const [inputValue, setInputValue] = useState("");

  if (!isOpen) return null;

  const isDisabled = requiresInput && inputValue !== "CONFIRM";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-50">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-text-muted hover:text-text-secondary cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-text-secondary mb-4">{message}</p>
        {requiresInput && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-1">
              Type <span className="font-bold">CONFIRM</span> to proceed:
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full border border-border-strong rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="CONFIRM"
            />
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setInputValue("");
              onConfirm();
            }}
            disabled={isDisabled}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeVariant(status: string): "success" | "warning" | "error" | "info" | "neutral" {
  const map: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
    DRAFT: "neutral",
    SCHEDULED: "info",
    OPEN: "success",
    CLOSED: "error",
    PUBLISHED: "info",
  };
  return map[status] || "neutral";
}

interface ElectionStats {
  eligibleStudents: number;
  candidates: number;
  positions: number;
  ballotsSubmitted: number;
  uniqueVoters: number;
  participation: number;
}

export default function ElectionManagementPage() {
  const [elections, setElections] = useState<AdminElectionRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [stats, setStats] = useState<ElectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedStatus, setSelectedStatus] = useState<string>("OPEN");
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  // Date editing (real PATCH /admin/elections/:id)
  const [editDates, setEditDates] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const selected = elections.find((e) => e.id === selectedId) || null;

  const load = useCallback(async () => {
    try {
      const res = await adminApi.getElections();
      const rows: AdminElectionRecord[] = Array.isArray(res)
        ? res
        : ((res as { elections?: AdminElectionRecord[] }).elections as AdminElectionRecord[]) ||
          ((res as { data?: AdminElectionRecord[] }).data as AdminElectionRecord[]) ||
          [];
      setElections(rows);
      setSelectedId((prev) => {
        if (prev && rows.some((r) => r.id === prev)) return prev;
        // Prefer the live election: OPEN, else first
        const open = rows.find((r) => r.status === "OPEN");
        return (open || rows[0])?.id ?? null;
      });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load elections. Please try again.");
    }
    setLoading(false);
  }, []);

  const loadStats = useCallback(async () => {
    if (selectedId === null) return;
    try {
      const res = await adminApi.getStats();
      setStats({
        eligibleStudents: res.students?.voting_eligible ?? 0,
        candidates: res.candidates?.total ?? 0,
        positions: 0,
        ballotsSubmitted: res.votes?.total ?? 0,
        uniqueVoters: res.votes?.unique_voters ?? 0,
        participation:
          res.students?.voting_eligible > 0
            ? Math.round(((res.votes?.unique_voters ?? 0) / res.students.voting_eligible) * 1000) / 10
            : 0,
      });
    } catch {
      // stats are supplementary — leave previous values on failure
    }
  }, [selectedId]);

  useEffect(() => {
    load();
    loadStats();
    // Real-time: refresh every 15s so ballots/status stay current
    const t = setInterval(() => {
      load();
      loadStats();
    }, 15000);
    return () => clearInterval(t);
  }, [load, loadStats]);

  // Pre-fill date fields when selection changes
  useEffect(() => {
    if (!selected) return;
    setStartDate(selected.start_time ? new Date(selected.start_time).toISOString().slice(0, 16) : "");
    setEndDate(selected.end_time ? new Date(selected.end_time).toISOString().slice(0, 16) : "");
  }, [selectedId, elections]); // eslint-disable-line react-hooks/exhaustive-deps

  const runAction = async (fn: () => Promise<unknown>) => {
    setActionBusy(true);
    setActionError("");
    try {
      await fn();
      await load();
      return true;
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed. Please try again.");
      return false;
    } finally {
      setActionBusy(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!selected) return;
    const ok = await runAction(() => adminApi.updateElectionStatus(selected.id, status));
    if (ok) setStatusModalOpen(false);
  };

  const handleCloseElection = async () => {
    if (!selected) return;
    const ok = await runAction(() => adminApi.updateElectionStatus(selected.id, "CLOSED"));
    if (ok) setCloseModalOpen(false);
  };

  const handlePublish = async () => {
    if (!selected) return;
    const ok = await runAction(() => adminApi.publishElectionResults(selected.id));
    if (ok) setPublishModalOpen(false);
  };

  const handleSaveDates = async () => {
    if (!selected) return;
    await runAction(() =>
      adminApi.updateElection(selected.id, {
        start_time: startDate ? new Date(startDate).toISOString() : undefined,
        end_time: endDate ? new Date(endDate).toISOString() : undefined,
      })
    );
    setEditDates(false);
  };

  const statCards = stats
    ? [
        { label: "Eligible Students", value: stats.eligibleStudents.toLocaleString(), icon: Users, color: "text-primary-600", bg: "bg-primary-50" },
        { label: "Candidates", value: stats.candidates.toLocaleString(), icon: Vote, color: "text-success-600", bg: "bg-success-50" },
        { label: "Ballots Submitted", value: stats.ballotsSubmitted.toLocaleString(), icon: CheckCircle2, color: "text-warning-600", bg: "bg-warning-50" },
        { label: "Unique Voters", value: stats.uniqueVoters.toLocaleString(), icon: Users, color: "text-primary-600", bg: "bg-primary-50" },
        { label: "Participation %", value: `${stats.participation}%`, icon: BarChart3, color: "text-primary-600", bg: "bg-primary-50" },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Election Management</h1>
            <p className="text-text-secondary mt-1">
              Live data from the database — auto-refreshes every 15 seconds.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { load(); loadStats(); }} className="gap-1.5" disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="p-4 flex items-center gap-3 border-error-200 bg-error-50">
            <AlertTriangle className="w-5 h-5 text-error-500" />
            <p className="text-sm text-error-600">{error}</p>
          </Card>
        )}

        {actionError && (
          <Card className="p-4 flex items-center gap-3 border-error-200 bg-error-50">
            <AlertTriangle className="w-5 h-5 text-error-500" />
            <p className="text-sm text-error-600">{actionError}</p>
          </Card>
        )}

        {loading ? (
          <Card className="p-12 text-center text-text-secondary">Loading elections…</Card>
        ) : elections.length === 0 ? (
          <Card className="p-12 text-center">
            <Inbox className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text-primary">No Elections Yet</h3>
            <p className="text-sm text-text-secondary mt-1">
              No elections exist in the database. Elections appear here once created.
            </p>
          </Card>
        ) : (
          <>
            {/* Election selector */}
            {elections.length > 1 && (
              <Card className="p-4">
                <label className="block text-sm font-medium text-text-primary mb-1">Election</label>
                <select
                  value={selectedId ?? ""}
                  onChange={(e) => setSelectedId(Number(e.target.value))}
                  className="w-full max-w-md border border-border-strong rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
                >
                  {elections.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.status})
                    </option>
                  ))}
                </select>
              </Card>
            )}

            {selected && (
              <>
                {/* Election Details Card — real data */}
                <Card className="p-6 border-l-4 border-l-primary-600">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-text-primary">{selected.name}</h2>
                      <p className="text-sm text-text-secondary">Election #{selected.id}</p>
                    </div>
                    <Badge variant={statusBadgeVariant(selected.status)}>{selected.status}</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-text-secondary flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Voting Starts
                      </p>
                      <p className="font-medium text-text-primary mt-1 text-sm">{formatDateTime(selected.start_time)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Voting Ends
                      </p>
                      <p className="font-medium text-text-primary mt-1 text-sm">{formatDateTime(selected.end_time)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">Status</p>
                      <Badge variant={statusBadgeVariant(selected.status)} className="mt-1">{selected.status}</Badge>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    {editDates ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Voting starts</label>
                          <input
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border border-border-strong rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-text-primary mb-1">Voting ends</label>
                          <input
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border border-border-strong rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="primary" size="sm" onClick={handleSaveDates} disabled={actionBusy}>
                            Save
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditDates(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditDates(true)}>
                        <Edit className="w-3.5 h-3.5" />
                        Edit Voting Dates
                      </Button>
                    )}
                  </div>
                </Card>

                {/* Status Control Card — real transitions */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Edit className="h-5 w-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-text-primary">Election Status Control</h2>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Current Status</p>
                      <Badge variant={statusBadgeVariant(selected.status)}>{selected.status}</Badge>
                    </div>
                    <div className="flex-1 max-w-xs">
                      <label className="block text-sm font-medium text-text-primary mb-1">New Status</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full border border-border-strong rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="self-end">
                      <Button variant="primary" size="md" onClick={() => setStatusModalOpen(true)} disabled={actionBusy}>
                        <Edit className="h-4 w-4" />
                        Update Status
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Election Statistics Card — live from /admin/stats */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="h-5 w-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-text-primary">Live Election Statistics</h2>
                  </div>
                  {statCards.length === 0 ? (
                    <p className="text-sm text-text-secondary">Loading statistics…</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {statCards.map((stat) => (
                        <div key={stat.label} className="text-center">
                          <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} mb-3`}>
                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                          </div>
                          <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                          <p className="text-sm text-text-secondary">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Danger Zone — real actions */}
                <Card className="p-6 border-2 border-error-200">
                  <div className="flex items-center gap-2 mb-6">
                    <AlertTriangle className="h-5 w-5 text-error-500" />
                    <h2 className="text-lg font-semibold text-text-primary">Danger Zone</h2>
                  </div>
                  <p className="text-sm text-text-secondary mb-6">
                    Irreversible actions that will affect the election.
                  </p>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-error-200 rounded-xl bg-error-50/30">
                      <div>
                        <p className="font-medium text-text-primary">Close Election</p>
                        <p className="text-sm text-text-secondary">
                          Stop voting and close the election immediately.
                        </p>
                      </div>
                      <Button variant="danger" size="sm" onClick={() => setCloseModalOpen(true)} disabled={actionBusy}>
                        Close Election
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-primary-200 rounded-xl bg-primary-50/30">
                      <div>
                        <p className="font-medium text-text-primary">Publish Results</p>
                        <p className="text-sm text-text-secondary">
                          Make election results publicly visible to all students.
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPublishModalOpen(true)}
                        disabled={actionBusy || selected.status === "PUBLISHED"}
                      >
                        {selected.status === "PUBLISHED" ? "Already Published" : "Publish Results"}
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Modals — all wired to real endpoints */}
                <StatusModal
                  isOpen={statusModalOpen}
                  title="Change Election Status?"
                  message={`You are about to change the election status to ${selectedStatus}.`}
                  confirmText="Update Status"
                  onConfirm={() => handleStatusUpdate(selectedStatus)}
                  onCancel={() => setStatusModalOpen(false)}
                />

                <StatusModal
                  isOpen={closeModalOpen}
                  title="Close Election?"
                  message="This will immediately stop all voting. Students will no longer be able to cast their votes. This action cannot be undone."
                  confirmText="Close Election"
                  onConfirm={handleCloseElection}
                  onCancel={() => setCloseModalOpen(false)}
                  requiresInput
                />

                <StatusModal
                  isOpen={publishModalOpen}
                  title="Publish Election Results?"
                  message="This will make the election results publicly visible to all students. The results will be final and cannot be retracted."
                  confirmText="Publish Results"
                  onConfirm={handlePublish}
                  onCancel={() => setPublishModalOpen(false)}
                  requiresInput
                />
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
