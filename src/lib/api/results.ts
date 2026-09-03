import { api } from "./client";

export interface PositionResult {
  position: string;
  candidates: CandidateResult[];
  totalVotes: number;
}

export interface CandidateResult {
  id: string;
  name: string;
  department: string;
  votes: number;
  percentage: number;
  status: "winner" | "runner_up" | "candidate";
  isTie: boolean;
}

export interface ElectionResults {
  electionName: string;
  totalVoters: number;
  totalVotesCast: number;
  participationRate: number;
  positions: PositionResult[];
}

export interface DepartmentParticipation {
  department: string;
  eligible: number;
  voted: number;
  rate: number;
}

export const resultsApi = {
  getResults: () => api.get<ElectionResults>("/results"),
  getDepartmentParticipation: () => api.get<DepartmentParticipation[]>("/results/participation"),
  getReports: () => api.get("/results/reports"),
};
