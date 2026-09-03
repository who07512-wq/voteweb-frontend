"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { BallotSelection, MOCK_VOTING_ELECTION } from "@/lib/election-voting-data";

interface VotingContextType {
  selections: BallotSelection[];
  setCandidate: (positionId: string, candidateId: string) => void;
  setAbstain: (positionId: string) => void;
  getSelection: (positionId: string) => BallotSelection | undefined;
  resetSelections: () => void;
}

const VotingContext = createContext<VotingContextType | null>(null);

export function useVoting() {
  const ctx = useContext(VotingContext);
  if (!ctx) throw new Error("useVoting must be used within VotingProvider");
  return ctx;
}

export function VotingProvider({ children }: { children: ReactNode }) {
  const [selections, setSelections] = useState<BallotSelection[]>(
    MOCK_VOTING_ELECTION.positions.map((p) => ({
      positionId: p.id,
      candidateId: undefined as unknown as string,
    }))
  );

  const setCandidate = useCallback((positionId: string, candidateId: string) => {
    setSelections((prev) =>
      prev.map((s) => (s.positionId === positionId ? { ...s, candidateId } : s))
    );
  }, []);

  const setAbstain = useCallback((positionId: string) => {
    setSelections((prev) =>
      prev.map((s) => (s.positionId === positionId ? { ...s, candidateId: null } : s))
    );
  }, []);

  const getSelection = useCallback(
    (positionId: string) => selections.find((s) => s.positionId === positionId),
    [selections]
  );

  const resetSelections = useCallback(() => {
    setSelections(
      MOCK_VOTING_ELECTION.positions.map((p) => ({
        positionId: p.id,
        candidateId: undefined as unknown as string,
      }))
    );
  }, []);

  return (
    <VotingContext.Provider value={{ selections, setCandidate, setAbstain, getSelection, resetSelections }}>
      {children}
    </VotingContext.Provider>
  );
}
