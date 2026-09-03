"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ISSUE_CATEGORIES } from "@/lib/help-data";
import {
  ArrowLeft,
  AlertCircle,
  Upload,
  X,
  CheckCircle2,
  Shield,
  FileText,
} from "lucide-react";

export default function ReportIssuePage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [receiptId, setReceiptId] = useState("");
  const [screenshot, setScreenshot] = useState<{ name: string; preview: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [errors, setErrors] = useState<{ category?: string; description?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!category) newErrors.category = "Please select an issue type.";
    if (!description.trim()) newErrors.description = "Please describe the issue.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const id = `SUP-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      const now = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      const requestData = {
        id,
        category,
        description,
        receiptId,
        screenshot: screenshot?.preview || null,
        status: "open",
        submitted: now,
        response: null,
        timeline: [
          { date: now, description: "Support request submitted." },
        ],
      };
      try { sessionStorage.setItem("newSupportRequest", JSON.stringify(requestData)); } catch { /* ignore */ }
      setRequestId(id);
      setIsSubmitting(false);
      setSubmitted(true);
    }, 2000);
  };

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setScreenshot({ name: file.name, preview: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (submitted) {
    return (
      <StudentLayout>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
            <div className="max-w-md w-full">
              <Card className="p-8 text-center border-border">
                <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h1 className="text-xl font-bold text-text-primary mb-2">Request Submitted</h1>
                <p className="text-sm text-text-secondary mb-6">
                  Your support request has been submitted successfully.
                </p>
                <div className="space-y-3 text-left bg-primary-50 rounded-xl p-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Request ID</span>
                    <span className="font-mono font-medium text-text-primary">{requestId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Category</span>
                    <span className="text-text-primary">{category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Status</span>
                    <Badge variant="info" className="text-[10px]">Open</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Submitted</span>
                    <span className="text-text-primary">{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Link href={`/student/help/request/${requestId}`}>
                    <Button variant="primary" className="w-full gap-2">
                      <FileText className="w-4 h-4" />
                      View Request
                    </Button>
                  </Link>
                  <Link href="/student/help">
                    <Button variant="ghost" className="w-full gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      Back to Help
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <Link href="/student/help">
                <Button variant="ghost" size="sm" className="gap-1.5 mb-3">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Help
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-text-primary">Report an Issue</h1>
              <p className="text-sm text-text-secondary">
                Provide enough information for the support team to understand the problem.
              </p>
            </div>

            {/* Issue Type */}
            <Card className="p-5 border-border">
              <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider block mb-2">
                Issue Type *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select issue type</option>
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-error mt-1">{errors.category}</p>}
            </Card>

            {/* Description */}
            <Card className="p-5 border-border">
              <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider block mb-2">
                What happened? *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                placeholder="Describe the issue you experienced..."
                rows={5}
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <div className="flex justify-between mt-1">
                {errors.description && <p className="text-xs text-error">{errors.description}</p>}
                <p className="text-[10px] text-text-secondary ml-auto">{description.length} / 1000</p>
              </div>
            </Card>

            {/* Receipt ID */}
            <Card className="p-5 border-border">
              <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider block mb-2">
                Receipt ID (Optional)
              </label>
              <input
                type="text"
                value={receiptId}
                onChange={(e) => setReceiptId(e.target.value)}
                placeholder="CV-2026-8F42-K7M9"
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              />
              <p className="text-[10px] text-text-secondary mt-1">
                Only provide your receipt ID if your issue is related to your vote receipt.
              </p>
            </Card>

            {/* Screenshot */}
            <Card className="p-5 border-border">
              <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider block mb-2">
                Screenshot (Optional)
              </label>
              {screenshot ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50">
                  <img src={screenshot.preview} alt="Screenshot" className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{screenshot.name}</p>
                    <button
                      onClick={() => setScreenshot(null)}
                      className="text-xs text-error hover:text-error/80"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary-200 transition-colors">
                  <Upload className="w-6 h-6 text-text-secondary" />
                  <span className="text-xs text-text-secondary">Upload Screenshot</span>
                  <span className="text-[10px] text-text-secondary">PNG, JPG, JPEG, WEBP</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
                </label>
              )}
            </Card>

            {/* Privacy Warning */}
            <Card className="p-4 border-warning/20 bg-warning-50">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning font-medium">
                  Do not include your password, authentication code, or candidate selections in your support request.
                </p>
              </div>
            </Card>

            {/* Submit */}
            <Button
              variant="primary"
              size="lg"
              className="w-full gap-2"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              <AlertCircle className="w-4 h-4" />
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
    </StudentLayout>
  );
}
