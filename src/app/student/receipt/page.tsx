"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Button } from "@/components/ui/Button";
import { ReceiptHeader } from "@/components/receipt/ReceiptHeader";
import { ReceiptId } from "@/components/receipt/ReceiptId";
import { ReceiptInformation } from "@/components/receipt/ReceiptInformation";
import { PrivacyNotice } from "@/components/receipt/PrivacyNotice";
import { ReceiptQRCode } from "@/components/receipt/ReceiptQRCode";
import { ReceiptVerification } from "@/components/receipt/ReceiptVerification";
import { ReceiptActions } from "@/components/receipt/ReceiptActions";
import { ReceiptHistory } from "@/components/receipt/ReceiptHistory";
import { MOCK_RECEIPT, MOCK_RECEIPT_HISTORY } from "@/lib/receipt-data";
import { ArrowLeft, Users } from "lucide-react";

export default function ReceiptPage() {
  const receipt = MOCK_RECEIPT;

  if (!receipt) {
    return (
      <StudentLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <ReceiptHeader electionName="Student Council Election 2026" />
          <div className="bg-white rounded-2xl p-12 border border-border shadow-sm text-center">
            <p className="text-text-secondary text-sm">No receipt available. Cast your vote to receive a receipt.</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Header */}
            <ReceiptHeader electionName={receipt.electionName} />

            {/* Receipt ID */}
            <ReceiptId receiptId={receipt.receiptId} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Receipt Information */}
                <ReceiptInformation receipt={receipt} />

                {/* Actions */}
                <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                  <h3 className="text-sm font-semibold text-text-primary mb-3">
                    Receipt Actions
                  </h3>
                  <ReceiptActions receipt={receipt} />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Privacy Notice */}
                <PrivacyNotice />

                {/* QR Code */}
                <ReceiptQRCode
                  receiptId={receipt.receiptId}
                  verificationUrl={receipt.verificationUrl}
                />
              </div>
            </div>

            {/* Verification */}
            <ReceiptVerification />

            {/* Receipt History */}
            <ReceiptHistory history={MOCK_RECEIPT_HISTORY} />

            {/* Navigation */}
            <div className="flex flex-wrap gap-3 justify-center pb-8">
              <Link href="/student/dashboard">
                <Button variant="secondary" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <Link href="/student/candidates">
                <Button variant="ghost" className="gap-2">
                  <Users className="w-4 h-4" />
                  View Candidates
                </Button>
              </Link>
            </div>
          </div>
    </StudentLayout>
  );
}
