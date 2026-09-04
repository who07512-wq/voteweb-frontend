"use client";

import React from "react";
import { CandidateLayout } from "@/components/candidate-dashboard/CandidateLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, Eye } from "lucide-react";
import { useCandidateApplication } from "@/hooks/useCandidateApplication";

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "approved":
      return "success";
    case "under_review":
    case "submitted":
      return "warning";
    case "rejected":
      return "error";
    case "changes_requested":
      return "warning";
    default:
      return "neutral";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Draft";
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under Review";
    case "changes_requested":
      return "Changes Requested";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

function getStatusDescription(status: string) {
  switch (status) {
    case "draft":
      return "Only you can see it. Your profile is not visible to anyone else until you submit it for review.";
    case "submitted":
      return "Your profile has been submitted and is waiting for election administration review.";
    case "under_review":
      return "Election administration can review it. Your profile is currently being evaluated.";
    case "changes_requested":
      return "Election administration has requested changes to your profile. Please review and update accordingly.";
    case "approved":
      return "Visible to eligible students. Your profile has been approved and is now publicly visible.";
    case "rejected":
      return "Not published. Your profile was not approved and is not visible to students.";
    default:
      return "";
  }
}

export default function CandidateProfilePreviewPage() {
  const { application, loading } = useCandidateApplication();

  if (loading) {
    return (
      <CandidateLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </CandidateLayout>
    );
  }

  const profile = application
    ? {
        name: application.name,
        id: application.id,
        position: application.position,
        department: application.department,
        year: application.year,
        biography: application.bio,
        manifesto: application.manifesto,
        campaignLogo: application.photo,
        applicationStatus: application.status,
      }
    : {
        name: "Candidate",
        id: "",
        position: "",
        department: "",
        year: "",
        biography: "",
        manifesto: "",
        campaignLogo: null as string | null,
        applicationStatus: "draft",
      };

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <CandidateLayout candidateName={profile.name} candidateId={profile.id}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Candidate Profile Preview
          </h1>
          <p className="text-text-secondary mt-1">
            See how your profile appears to students during the election.
          </p>
        </div>

        {/* Notice Banner */}
        <Card className="border-primary-100 bg-primary-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100">
              <Eye className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-700">
                This is how students will see your approved profile.
              </p>
              <p className="text-xs text-primary-500 mt-0.5">
                Review your profile carefully before submitting for approval.
              </p>
            </div>
          </div>
        </Card>

        {/* Profile Preview - styled like student-facing candidate profile */}
        <div className="relative rounded-2xl overflow-hidden bg-primary-50">
          <div className="p-6">
            {/* Top section with avatar and info */}
            <div className="flex items-start gap-4 mb-5">
              {/* Large avatar/initials */}
              {profile.campaignLogo ? (
                <img
                  src={profile.campaignLogo}
                  alt={profile.name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-primary-600 flex items-center justify-center font-bold text-white text-2xl shadow-sm">
                  {initials}
                </div>
              )}

              <div className="flex-1">
                <h2 className="text-xl font-bold text-text-primary">
                  {profile.name}
                </h2>
                {profile.position && (
                  <Badge variant="info" className="mt-1">
                    {profile.position}
                  </Badge>
                )}
                <p className="text-sm text-text-secondary mt-2">
                  {profile.department} &middot; {profile.year}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  <span className="text-sm font-medium text-success-600">
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Campaign Logo Section */}
            {profile.campaignLogo && (
              <div className="mb-4 p-3 bg-white rounded-xl border border-border">
                <p className="text-xs text-text-secondary mb-2">Campaign Logo</p>
                <img
                  src={profile.campaignLogo}
                  alt="Campaign logo"
                  className="h-16 object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Biography Section */}
        <Card>
          <h3 className="text-lg font-bold text-text-primary border-b border-border pb-3">
            About
          </h3>
          <p className="text-text-secondary leading-relaxed mt-4">
            {profile.biography || "No biography submitted yet."}
          </p>
        </Card>

        {/* Manifesto Section */}
        <Card>
          <h3 className="text-lg font-bold text-text-primary border-b border-border pb-3">
            Manifesto
          </h3>
          <div className="mt-4 space-y-4">
            {profile.manifesto ? (
              <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                {profile.manifesto}
              </p>
            ) : (
              <p className="text-text-secondary text-sm italic">
                No manifesto available
              </p>
            )}
          </div>
        </Card>

        {/* Profile Visibility Section */}
        <Card>
          <h3 className="text-lg font-bold text-text-primary border-b border-border pb-3">
            Profile Visibility
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary">Current Status:</span>
              <Badge variant={getStatusBadgeVariant(profile.applicationStatus)}>
                {getStatusLabel(profile.applicationStatus)}
              </Badge>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              {getStatusDescription(profile.applicationStatus)}
            </p>
          </div>
        </Card>
      </div>
    </CandidateLayout>
  );
}