"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_ADMIN_ELECTION, STATUS_OPTIONS } from "@/lib/admin-dashboard-data";
import {
  Vote,
  Calendar,
  Users,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit,
} from "lucide-react";

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

export default function ElectionManagementPage() {
  const election = MOCK_ADMIN_ELECTION;
  const [selectedStatus, setSelectedStatus] = useState("Voting Open");
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  const statusBadgeVariant = (status: string) => {
    const map: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
      Draft: "neutral",
      Scheduled: "info",
      "Registration Open": "warning",
      "Voting Open": "success",
      "Voting Closed": "error",
      "Results Published": "info",
    };
    return map[status] || "default";
  };

  const stats = [
    { label: "Eligible Students", value: election.eligibleStudents.toLocaleString(), icon: Users, color: "text-primary-600", bg: "bg-primary-50" },
    { label: "Candidates", value: election.totalCandidates, icon: Vote, color: "text-success-600", bg: "bg-success-50" },
    { label: "Positions", value: election.totalPositions, icon: BarChart3, color: "text-primary-600", bg: "bg-primary-50" },
    { label: "Ballots Submitted", value: election.ballotsSubmitted.toLocaleString(), icon: CheckCircle2, color: "text-warning-600", bg: "bg-warning-50" },
    { label: "Participation %", value: `${election.participation}%`, icon: BarChart3, color: "text-primary-600", bg: "bg-primary-50" },
  ];

  const handleStatusUpdate = () => {
    setStatusModalOpen(false);
  };

  const handleDangerAction = (type: "close" | "reset" | "publish") => {
    setCloseModalOpen(false);
    setResetModalOpen(false);
    setPublishModalOpen(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Election Management</h1>
          <p className="text-text-secondary mt-1">
            Configure and manage the Student Council Election 2026.
          </p>
        </div>

        {/* Election Details Card */}
        <Card className="p-6 border-l-4 border-l-primary-600">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{election.name}</h2>
              <p className="text-sm text-text-secondary">Year {election.year}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusBadgeVariant("Voting Open")}>Voting Open</Badge>
            </div>
          </div>
          <p className="text-sm text-text-secondary mb-6">
            {election.institution} &middot; {election.votingMethod}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-text-secondary">Registration Period</p>
              <p className="font-medium text-text-primary mt-1 text-sm">
                {election.registrationStart} – {election.registrationEnd}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Voting Period</p>
              <p className="font-medium text-text-primary mt-1 text-sm">
                {election.votingStart}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Voting Ends</p>
              <p className="font-medium text-text-primary mt-1 text-sm">
                {election.votingEnd}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Results Publication</p>
              <p className="font-medium text-text-primary mt-1 text-sm">
                {election.resultsDate}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Status</p>
              <Badge variant="success" className="mt-1">Voting Open</Badge>
            </div>
          </div>
        </Card>

        {/* Status Control Card */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Edit className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-text-primary">Election Status Control</h2>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">Current Status</p>
              <Badge variant="success">Voting Open</Badge>
            </div>
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-text-primary mb-1">
                New Status
              </label>
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
              <Button
                variant="primary"
                size="md"
                onClick={() => setStatusModalOpen(true)}
              >
                <Edit className="h-4 w-4" />
                Update Status
              </Button>
            </div>
          </div>
        </Card>

        {/* Election Statistics Card */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-text-primary">Election Statistics</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} mb-3`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-sm text-text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Danger Zone Card */}
        <Card className="p-6 border-2 border-error-200">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="h-5 w-5 text-error-500" />
            <h2 className="text-lg font-semibold text-text-primary">Danger Zone</h2>
          </div>
          <p className="text-sm text-text-secondary mb-6">
            Irreversible actions that will affect the election.
          </p>
          <div className="space-y-4">
            {/* Close Election */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-error-200 rounded-xl bg-error-50/30">
              <div>
                <p className="font-medium text-text-primary">Close Election</p>
                <p className="text-sm text-text-secondary">
                  Stop voting and close the election immediately.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setCloseModalOpen(true)}
              >
                Close Election
              </Button>
            </div>

            {/* Reset Configuration */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-warning-200 rounded-xl bg-warning-50/30">
              <div>
                <p className="font-medium text-text-primary">Reset Election Configuration</p>
                <p className="text-sm text-text-secondary">
                  Reset all election settings to default. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-warning-300 text-warning-700 hover:bg-warning-50"
                onClick={() => setResetModalOpen(true)}
              >
                Reset Configuration
              </Button>
            </div>

            {/* Publish Results */}
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
              >
                Publish Results
              </Button>
            </div>
          </div>
        </Card>

        {/* Modals */}
        <StatusModal
          isOpen={statusModalOpen}
          title="Change Election Status?"
          message={`You are about to change the election status to ${selectedStatus}.`}
          confirmText="Update Status"
          onConfirm={handleStatusUpdate}
          onCancel={() => setStatusModalOpen(false)}
        />

        <StatusModal
          isOpen={closeModalOpen}
          title="Close Election?"
          message="This will immediately stop all voting. Students will no longer be able to cast their votes. This action cannot be undone."
          confirmText="Close Election"
          onConfirm={() => handleDangerAction("close")}
          onCancel={() => setCloseModalOpen(false)}
          requiresInput
        />

        <StatusModal
          isOpen={resetModalOpen}
          title="Reset Election Configuration?"
          message="This will reset all election settings, dates, and configurations to their default values. All current data may be lost."
          confirmText="Reset Configuration"
          onConfirm={() => handleDangerAction("reset")}
          onCancel={() => setResetModalOpen(false)}
        />

        <StatusModal
          isOpen={publishModalOpen}
          title="Publish Election Results?"
          message="This will make the election results publicly visible to all students. The results will be final and cannot be retracted."
          confirmText="Publish Results"
          onConfirm={() => handleDangerAction("publish")}
          onCancel={() => setPublishModalOpen(false)}
        />
      </div>
    </AdminLayout>
  );
}
