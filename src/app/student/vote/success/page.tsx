"use client";

import React from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { VotingProgress } from "@/components/voting/VotingProgress";
import { CheckCircle2, ArrowLeft, FileText } from "lucide-react";

const STEPS = ["Select Candidates", "Review Ballot", "Confirm Vote"];

export default function VoteSuccessPage() {
  return (
    <StudentLayout>
      <div className="flex items-center justify-center h-full">
        <div className="max-w-md w-full space-y-6">
          <VotingProgress currentStep={2} totalSteps={3} steps={STEPS} />

          <Card className="p-8 text-center border-border">
            <div className="w-20 h-20 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">
              Your Vote Has Been Recorded
            </h1>
            <p className="text-sm text-text-secondary mb-6">
              Your ballot has been successfully submitted.
            </p>
            <div className="p-4 rounded-xl bg-primary-50 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-sm font-medium text-primary-700">
                  Student Council Election 2026
                </span>
              </div>
              <Badge variant="success" className="text-xs">
                &#10003; Submitted
              </Badge>
            </div>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed">
              For your privacy, your specific candidate selections are not displayed on this page.
            </p>
            <div className="space-y-3">
              <Link href="/student/receipt">
                <Button variant="primary" className="w-full gap-2">
                  <FileText className="w-4 h-4" />
                  View Vote Receipt
                </Button>
              </Link>
              <Link href="/student/dashboard">
                <Button variant="ghost" className="w-full gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}
