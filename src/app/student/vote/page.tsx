"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { VotingProgress } from "@/components/voting/VotingProgress";
import { ElectionInfoCard } from "@/components/voting/ElectionInfoCard";
import { CandidateVotingCard } from "@/components/voting/CandidateVotingCard";
import { AbstainOption } from "@/components/voting/AbstainOption";
import { VotingNavigation } from "@/components/voting/VotingNavigation";
import { LeaveVotingModal } from "@/components/voting/LeaveVotingModal";
import {
  VotingClosedState,
  NotEligibleState,
  AlreadyVotedState,
} from "@/components/voting/VotingStates";
import { VotingProvider, useVoting } from "@/components/voting/VotingContext";
import { getApprovedCandidatesAsVotingPositions } from "@/lib/candidate-application-store";
import type { VotingPosition } from "@/lib/election-voting-data";
import { AlertTriangle } from "lucide-react";

const STEPS = ["Select Candidates", "Review Ballot", "Confirm Vote"];

function VotePageInner() {
  const router = useRouter();
  const { selections, setCandidate, setAbstain, getSelection } = useVoting();

  const [positions, setPositions] = useState<VotingPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  useEffect(() => {
    getApprovedCandidatesAsVotingPositions()
      .then(setPositions)
      .catch(() => setPositions([]))
      .finally(() => setLoading(false));
  }, []);

  const currentPositionData = positions[currentPosition];
  const currentSelection = getSelection(currentPositionData?.id);
  const hasSelection =
    currentSelection?.candidateId !== undefined &&
    currentSelection?.candidateId !== null;

  const handleSelectCandidate = useCallback(
    (candidateId: string) => {
      setCandidate(currentPositionData?.id, candidateId);
    },
    [currentPositionData?.id, setCandidate]
  );

  const handleAbstain = useCallback(() => {
    setAbstain(currentPositionData?.id);
  }, [currentPositionData?.id, setAbstain]);

  const handlePrevious = useCallback(() => {
    if (currentPosition > 0) {
      setCurrentPosition((prev) => prev - 1);
    }
  }, [currentPosition]);

  const handleNext = useCallback(() => {
    if (!hasSelection && currentSelection?.candidateId === undefined) return;

    if (currentPosition < positions.length - 1) {
      setCurrentPosition((prev) => prev + 1);
    } else {
      router.push("/student/vote/review");
    }
  }, [currentPosition, positions.length, hasSelection, currentSelection?.candidateId, router]);

  const handleLeave = useCallback(() => {
    setShowLeaveModal(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    } else {
      router.push("/student/dashboard");
    }
  }, [pendingNavigation, router]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasAnySelection = selections.some(
        (s) => s.candidateId !== undefined
      );
      if (hasAnySelection) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [selections]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </StudentLayout>
    );
  }

  if (positions.length === 0) {
    return (
      <StudentLayout>
        <div className="max-w-7xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Cast Your Vote</h1>
            <p className="text-sm text-text-secondary">No positions available for voting yet.</p>
          </div>
          <Card className="p-12 text-center">
            <p className="text-text-secondary">Voting positions will appear here once candidates are approved.</p>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  return (
    <>
    <StudentLayout>
        <div className="max-w-7xl mx-auto w-full space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="info" className="text-[10px]">Student Council Election 2026</Badge>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-medium text-success">Voting Open</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Cast Your Vote</h1>
            <p className="text-sm text-text-secondary">
              Select one candidate for each available position. Review your ballot carefully before submitting.
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-warning-50 border border-warning/20">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <p className="text-xs text-warning font-medium">
              Your vote cannot be changed after submission.
            </p>
          </div>

          <VotingProgress
            currentStep={0}
            totalSteps={3}
            steps={STEPS}
          />

          <Card className="border-border overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border bg-primary-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">
                    Position {currentPosition + 1} of {positions.length}
                  </span>
                  <h2 className="text-lg font-bold text-text-primary mt-1">
                    {currentPositionData.name}
                  </h2>
                </div>
                <Badge variant="info" className="text-[10px]">
                  {currentPosition + 1} / {positions.length}
                </Badge>
              </div>
              <p className="text-xs text-text-secondary mt-2">
                Select one candidate.
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentPositionData.candidates.map((candidate) => (
                  <CandidateVotingCard
                    key={candidate.id}
                    candidate={candidate}
                    isSelected={currentSelection?.candidateId === candidate.id}
                    onSelect={handleSelectCandidate}
                  />
                ))}
              </div>

              <AbstainOption
                isAbstained={currentSelection?.candidateId === null}
                onAbstain={handleAbstain}
              />

              {currentSelection?.candidateId === undefined && (
                <p className="text-xs text-text-secondary text-center py-1">
                  Please select a candidate or choose to abstain.
                </p>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-border">
              <VotingNavigation
                currentStep={currentPosition}
                totalSteps={positions.length}
                hasSelection={
                  currentSelection?.candidateId !== undefined
                }
                onPrevious={handlePrevious}
                onNext={handleNext}
              />
            </div>
          </Card>
        </div>
      </StudentLayout>

      <LeaveVotingModal
        isOpen={showLeaveModal}
        onStay={() => setShowLeaveModal(false)}
        onLeave={handleLeave}
      />
    </>
  );
}

export default function VotePage() {
  return (
    <VotingProvider>
      <VotePageInner />
    </VotingProvider>
  );
}
