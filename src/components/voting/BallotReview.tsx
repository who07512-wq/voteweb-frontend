"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Check, Edit2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { VotingPosition, BallotSelection, VotingCandidate } from "@/lib/election-voting-data";

interface BallotReviewProps {
  positions: VotingPosition[];
  selections: BallotSelection[];
  onChangeSelection: (positionIndex: number) => void;
}

export const BallotReview: React.FC<BallotReviewProps> = ({
  positions,
  selections,
  onChangeSelection,
}) => {
  return (
    <div className="space-y-3">
      {positions.map((position, index) => {
        const selection = selections.find((s) => s.positionId === position.id);
        const selectedCandidate = selection?.candidateId
          ? position.candidates.find((c) => c.id === selection.candidateId) || null
          : null;
        const isAbstained = selection?.candidateId === null;

        return (
          <Card key={position.id} className="p-4 border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">
                    Position {index + 1}
                  </span>
                </div>
                <h4 className="font-semibold text-text-primary text-sm mb-2">
                  {position.name}
                </h4>

                {isAbstained ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Minus className="w-3.5 h-3.5 text-warning" />
                    </div>
                    <span className="text-sm text-warning font-medium">Abstained</span>
                  </div>
                ) : selectedCandidate ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                      {selectedCandidate.photoInitials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {selectedCandidate.name}
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        {selectedCandidate.department} &bull; {selectedCandidate.year}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Badge variant="warning" className="text-[10px]">No Selection</Badge>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => onChangeSelection(index)}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Change
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
