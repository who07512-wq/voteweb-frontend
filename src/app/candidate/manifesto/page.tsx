"use client";

import React, { useEffect, useState } from "react";
import { CandidateLayout } from "@/components/candidate-dashboard/CandidateLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useCandidateApplication } from "@/hooks/useCandidateApplication";
import { updateMyProfile } from "@/lib/candidate-api";
import { FileText, Save, Loader2, AlertCircle } from "lucide-react";

export default function CandidateManifestoPage() {
  const { application, loading: appLoading } = useCandidateApplication();
  const [manifesto, setManifesto] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const MAX_CHARS = 2000;

  // Hydrate from the real application once it loads.
  useEffect(() => {
    if (!application || hydrated) return;
    setManifesto(application.manifesto || "");
    setHydrated(true);
  }, [application, hydrated]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateMyProfile({ manifesto: manifesto.trim() });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save manifesto."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <CandidateLayout>
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              My Manifesto
            </h1>
            <p className="text-sm text-text-secondary">
              Write the manifesto voters will see on your public profile.
            </p>
          </div>
        </div>

        <Card className="p-6">
          {appLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    Manifesto
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Describe your vision, goals, and what you plan to achieve if
                    elected. This is displayed on your public candidate profile.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-text-primary">
                    Manifesto Content
                  </label>
                  <span
                    className={`text-xs ${
                      manifesto.length > MAX_CHARS
                        ? "text-error-600 font-medium"
                        : "text-text-secondary"
                    }`}
                  >
                    {manifesto.length}/{MAX_CHARS}
                  </span>
                </div>
                <textarea
                  value={manifesto}
                  onChange={(e) => setManifesto(e.target.value)}
                  maxLength={MAX_CHARS}
                  rows={12}
                  placeholder="Describe your vision, goals and what you plan to achieve if elected..."
                  className="w-full px-4 py-3 text-sm border border-border rounded-xl bg-white text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                />
                {manifesto.length >= MAX_CHARS && (
                  <p className="text-xs text-warning-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    Character limit reached
                  </p>
                )}
              </div>

              {saveError && (
                <p className="text-xs text-error-600 font-medium">{saveError}</p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving || !manifesto.trim()}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1.5" />
                      Save Manifesto
                    </>
                  )}
                </Button>
                {saveSuccess && (
                  <span className="text-sm text-emerald-600 font-medium">
                    Saved successfully
                  </span>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </CandidateLayout>
  );
}