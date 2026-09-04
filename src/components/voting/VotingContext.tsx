"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { BallotSelection } from "@/lib/election-voting-data";

const STORAGE_KEY = "campusvote_ballot_selections";

interface VotingContextType {
  selections: BallotSelection[];
  setCandidate: (positionId: string, candidateId: string) => void;
  setAbstain: (positionId: string) => void;
  getSelection: (positionId: string) => BallotSelection | undefined;
  seedSelections: (positions: { id: string }[]) => void;
  resetSelections: () => void;
}

const VotingContext = createContext<VotingContextType | null>(null);

export function useVoting() {
  const ctx = useContext(VotingContext);
  if (!ctx) throw new Error("useVoting must be used within VotingProvider");
  return ctx;
}

function loadStoredSelections(): BallotSelection[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function VotingProvider({ children }: { children: ReactNode }) {
  const [selections, setSelections] = useState<BallotSelection[]>(
    loadStoredSelections() || []
  );

  // Persist across the vote -> review pages (each page mounts its own provider).
  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
    } catch {
      // Storage unavailable - selections still work within this page.
    }
  }, [selections]);

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

  // Reset the ballot to the live positions, keeping any earlier answers for
  // positions that still exist on this ballot.
  const seedSelections = useCallback((positions: { id: string }[]) => {
    const existing = loadStoredSelections() || [];
    setSelections(
      positions.map((p) => {
        const prev = existing.find((s) => s.positionId === p.id);
        return prev ? prev : { positionId: p.id, candidateId: undefined };
      })
    );
  }, []);

  const resetSelections = useCallback(() => {
    setSelections([]);
  }, []);

  return (
    <VotingContext.Provider
      value={{ selections, setCandidate, setAbstain, getSelection, seedSelections, resetSelections }}
    >
      {children}
    </VotingContext.Provider>
  );
}
