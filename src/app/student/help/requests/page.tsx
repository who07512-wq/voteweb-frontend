"use client";

import React from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_SUPPORT_REQUESTS } from "@/lib/help-data";
import {
  ArrowLeft,
  FileText,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; variant: string }> = {
  open: { label: "Open", variant: "info" },
  in_review: { label: "In Review", variant: "warning" },
  waiting: { label: "Waiting for Student", variant: "warning" },
  resolved: { label: "Resolved", variant: "success" },
  closed: { label: "Closed", variant: "neutral" },
};

export default function RequestsPage() {
  return (
    <StudentLayout>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <Link href="/student/help">
                <Button variant="ghost" size="sm" className="gap-1.5 mb-3">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Help
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-text-primary">My Support Requests</h1>
              <p className="text-sm text-text-secondary">
                Track the status of your support requests.
              </p>
            </div>

            {/* Requests */}
            {MOCK_SUPPORT_REQUESTS.length === 0 ? (
              <Card className="p-8 text-center border-border">
                <FileText className="w-10 h-10 text-text-secondary mx-auto mb-3" />
                <h2 className="text-lg font-bold text-text-primary mb-2">No Support Requests</h2>
                <p className="text-sm text-text-secondary mb-4">
                  You haven&apos;t submitted any support requests yet.
                </p>
                <Link href="/student/help/report">
                  <Button variant="primary" size="sm" className="gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Report an Issue
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {MOCK_SUPPORT_REQUESTS.map((req) => {
                  const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.open;
                  return (
                    <Link key={req.id} href={`/student/help/request/${req.id}`}>
                      <Card className="p-4 border-border hover:border-primary-200 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-mono font-semibold text-text-primary">
                                {req.id}
                              </span>
                              <Badge variant={status.variant as "info" | "warning" | "success" | "neutral"} className="text-[10px]">
                                {status.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-text-secondary mb-1">{req.category}</p>
                            <p className="text-xs text-text-secondary">
                              Submitted: {req.submitted}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-text-secondary shrink-0" />
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
    </StudentLayout>
  );
}
