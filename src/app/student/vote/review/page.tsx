"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VotingProgress } from "@/components/voting/VotingProgress";
import { BallotReview } from "@/components/voting/BallotReview";
import { PrivacyNotice } from "@/components/voting/PrivacyNotice";
import { ConfirmationModal } from "@/components/voting/ConfirmationModal";
import { VotingProvider, useVoting } from "@/components/voting/VotingContext";
import { getApprovedCandidatesAsVotingPositions } from "@/lib/candidate-application-store";
import type { VotingPosition } from "@/lib/election-voting-data";

const STEPS = ["Select Candidates", "Review Ballot", "Confirm Vote"];

function ReviewPageInner() {
  const router = useRouter();
  const { selections } = useVoting();
  const [positions, setPositions] = useState<VotingPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getApprovedCandidatesAsVotingPositions()
      .then(setPositions)
      .catch(() => setPositions([]))
      .finally(() => setLoading(false));
  }, []);

  const handleChangeSelection = () => {
    router.push(`/student/vote`);
  };

  const handleSubmit = () => {
    setShowModal(true);
  };

  const handleConfirmSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowModal(false);
      router.push("/student/vote/success");
    }, 2000);
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <>
      <StudentLayout>
        <div className="max-w-7xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Review Your Ballot</h1>
            <p className="text-sm text-text-secondary">
              Review your selections carefully before submitting your vote.
            </p>
          </div>

          <VotingProgress
            currentStep={1}
            totalSteps={3}
            steps={STEPS}
          />

          <PrivacyNotice />

          <BallotReview
            positions={positions}
            selections={selections}
            onChangeSelection={handleChangeSelection}
          />

          <Card className="p-5 border-border">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-text-secondary">
                I have reviewed my selections and understand that my vote cannot be changed after submission.
              </span>
            </label>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="md"
              className="gap-1.5"
              onClick={() => router.push("/student/vote")}
            >
              Back to Voting
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1 gap-2"
              disabled={!isConfirmed}
              onClick={handleSubmit}
            >
              Confirm & Submit Vote
            </Button>
          </div>
        </div>
      </StudentLayout>

      <ConfirmationModal
        isOpen={showModal}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmSubmit}
        onBack={() => setShowModal(false)}
      />
    </>
  );
}

export default function ReviewPage() {
  return (
    <VotingProvider>
      <ReviewPageInner />
    </VotingProvider>
  );
}
