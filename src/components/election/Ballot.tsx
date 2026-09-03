"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, Info, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { positions, type Position, type Candidate } from "@/lib/election-data";
import { cn } from "@/lib/utils";

interface BallotProps {
  onSubmit: (votes: Record<string, string>) => void;
  isSubmitting?: boolean;
}

export const Ballot: React.FC<BallotProps> = ({ onSubmit, isSubmitting = false }) => {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);

  const handleSelect = (positionId: string, candidateId: string) => {
    setSelections((prev) => ({
      ...prev,
      [positionId]: candidateId,
    }));
  };

  const handleExpand = (candidateId: string) => {
    setExpandedCandidate((prev) => (prev === candidateId ? null : candidateId));
  };

  const isComplete = positions.every((pos) => selections[pos.id]);
  const getSelectedCount = () => Object.keys(selections).length;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="bg-slate-50 border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">Ballot Progress</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {getSelectedCount()} of {positions.length} positions selected
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(getSelectedCount() / positions.length) * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold text-slate-700">
              {Math.round((getSelectedCount() / positions.length) * 100)}%
            </span>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-3 sm:hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(getSelectedCount() / positions.length) * 100}%` }}
          />
        </div>
      </Card>

      {/* Positions */}
      <div className="space-y-4" role="list" aria-label="Ballot positions">
        {positions.map((position) => (
          <PositionCard
            key={position.id}
            position={position}
            selectedId={selections[position.id]}
            onSelect={handleSelect}
            onExpand={handleExpand}
            expandedId={expandedCandidate}
            disabled={isSubmitting}
          />
        ))}
      </div>

      {/* Submit Section */}
      <Card className={cn("p-4 border-l-4 border-l-blue-600", isComplete ? "bg-emerald-50 border-l-emerald-600" : "bg-slate-50")}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            {isComplete ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">Ballot Complete</p>
                  <p className="text-xs text-emerald-600">All positions have a selection. Ready to submit.</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Ballot Incomplete</p>
                  <p className="text-xs text-amber-600">
                    Please select candidates for all {positions.length} positions before submitting.
                  </p>
                </div>
              </>
            )}
          </div>
          <Button
            size="lg"
            onClick={() => isComplete && onSubmit(selections)}
            disabled={!isComplete || isSubmitting}
            className="w-full sm:w-auto gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                Submit Ballot
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Important Notice */}
      <Card className="border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 space-y-1">
            <p className="font-bold">Important Reminders</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>You can only submit <strong>one ballot</strong>. Votes cannot be changed after submission.</li>
              <li>Your vote is <strong>anonymous</strong> — your identity is not linked to your choices.</li>
              <li>You will receive a <strong>cryptographic receipt</strong> to verify your ballot was recorded.</li>
              <li>Review all selections carefully before submitting.</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

interface PositionCardProps {
  position: Position;
  selectedId: string | undefined;
  onSelect: (positionId: string, candidateId: string) => void;
  onExpand: (candidateId: string) => void;
  expandedId: string | null;
  disabled: boolean;
}

const PositionCard: React.FC<PositionCardProps> = ({
  position,
  selectedId,
  onSelect,
  onExpand,
  expandedId,
  disabled,
}) => {
  const isExpanded = (candidateId: string) => expandedId === candidateId;

  return (
    <Card className={cn("overflow-hidden transition-all", selectedId && "border-blue-300 bg-blue-50/30")}>
      {/* Position Header */}
      <div
        className={cn(
          "flex items-center gap-3 p-4 cursor-pointer transition-colors",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50"
        )}
        onClick={() => !disabled && onExpand(position.candidates[0]?.id || "")}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 flex-shrink-0",
            selectedId ? "bg-blue-600" : "bg-slate-100"
          )}
        >
          {selectedId ? (
            <CheckCircle2 className="w-5 h-5 text-white" />
          ) : (
            <Circle className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 truncate">{position.title}</h3>
            <Badge variant="info" className="text-xs">
              Select {position.maxSelections}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{position.description}</p>
        </div>
        <Badge variant={selectedId ? "success" : "neutral"} className="text-xs font-medium">
          {selectedId ? "Selected" : "Pending"}
        </Badge>
      </div>

      {/* Candidates List */}
      <div className="border-t border-slate-100 bg-white">
        {position.candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            isSelected={selectedId === candidate.id}
            isExpanded={isExpanded(candidate.id)}
            onSelect={() => !disabled && onSelect(position.id, candidate.id)}
            onExpand={() => !disabled && onExpand(candidate.id)}
            disabled={disabled}
          />
        ))}
      </div>
    </Card>
  );
};

interface CandidateCardProps {
  candidate: Candidate;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onExpand: () => void;
  disabled: boolean;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  isSelected,
  isExpanded,
  onSelect,
  onExpand,
  disabled,
}) => {
  return (
    <div
      className={cn(
        "p-4 border-b border-slate-100 last:border-0 transition-all cursor-pointer",
        isSelected ? "bg-blue-50/50" : "hover:bg-slate-50/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        {/* Selection Indicator */}
        <div className="flex items-center justify-center mt-1 shrink-0">
          {isSelected ? (
            <div className="w-5 h-5 rounded-full border-2 border-blue-600 bg-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center" />
          )}
        </div>

        {/* Candidate Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-900 truncate">{candidate.name}</h4>
            {isSelected && (
              <Badge variant="success" className="text-[10px]">
                Your Choice
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{candidate.department}</span>
            <span>•</span>
            <span>{candidate.year}</span>
          </div>

          {/* Expandable Manifesto */}
          <div className="mt-3 overflow-hidden transition-all duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              disabled={disabled}
            >
              {isExpanded ? (
                <>
                  <span>Hide Manifesto</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span>View Manifesto</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>

            {isExpanded && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 animate-slide-down">
                <p className="text-xs text-slate-700 leading-relaxed">{candidate.manifesto}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};