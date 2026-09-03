"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_SUPPORT_REQUESTS } from "@/lib/help-data";
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Clock,
  User,
  Headphones,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; variant: string }> = {
  open: { label: "Open", variant: "info" },
  in_review: { label: "In Review", variant: "warning" },
  waiting: { label: "Waiting for Student", variant: "warning" },
  resolved: { label: "Resolved", variant: "success" },
  closed: { label: "Closed", variant: "neutral" },
};

function getNewlySubmittedRequest(id: string) {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem("newSupportRequest");
    if (!stored) return null;
    const req = JSON.parse(stored);
    if (req.id === id) return req;
  } catch { /* ignore */ }
  return null;
}

export default function RequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const mockRequest = MOCK_SUPPORT_REQUESTS.find((r) => r.id === requestId);
  const [newRequest, setNewRequest] = useState<any>(null);

  useEffect(() => {
    if (!mockRequest) {
      const stored = getNewlySubmittedRequest(requestId);
      if (stored) setNewRequest(stored);
    }
  }, [requestId, mockRequest]);

  const request = mockRequest || newRequest;

  if (!request) {
    return (
      <StudentLayout>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
            <Card className="max-w-md mx-auto p-8 text-center border-border">
              <FileText className="w-10 h-10 text-text-secondary mx-auto mb-3" />
              <h1 className="text-lg font-bold text-text-primary mb-2">Request Not Found</h1>
              <p className="text-sm text-text-secondary mb-4">
                We couldn&apos;t find this support request.
              </p>
              <Link href="/student/help/requests">
                <Button variant="primary" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Requests
                </Button>
              </Link>
            </Card>
          </div>
      </StudentLayout>
    );
  }

  const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.open;

  return (
    <StudentLayout>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <Link href="/student/help/requests">
                <Button variant="ghost" size="sm" className="gap-1.5 mb-3">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Requests
                </Button>
              </Link>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-text-primary font-mono">{request.id}</h1>
                <Badge variant={status.variant as "info" | "warning" | "success" | "neutral"} className="text-[10px]">
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary">{request.category}</p>
            </div>

            {/* Request Info */}
            <Card className="p-5 border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Request Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Request ID</span>
                  <span className="font-mono text-text-primary">{request.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Category</span>
                  <span className="text-text-primary">{request.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Submitted</span>
                  <span className="text-text-primary">{request.submitted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Status</span>
                  <Badge variant={status.variant as "info" | "warning" | "success" | "neutral"} className="text-[10px]">
                    {status.label}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card className="p-5 border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Description</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{request.description}</p>
            </Card>

            {/* Support Response */}
            {request.response && (
              <Card className="p-5 border-success/20 bg-success-50">
                <div className="flex items-start gap-3">
                  <Headphones className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-success mb-2">Support Response</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{request.response}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Timeline */}
            <Card className="p-5 border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Timeline</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-4">
                  {request.timeline.map((event: { date: string; description: string }, i: number) => (
                    <div key={i} className="flex items-start gap-4 relative">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0 z-10">
                        {i === 0 ? (
                          <User className="w-3.5 h-3.5 text-primary-600" />
                        ) : i === request.timeline.length - 1 && request.response ? (
                          <Headphones className="w-3.5 h-3.5 text-primary-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-primary-600" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className="text-xs text-text-secondary">{event.date}</p>
                        <p className="text-sm text-text-primary">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
    </StudentLayout>
  );
}
