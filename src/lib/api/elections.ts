import { api } from "./client";

export interface Election {
  id: string;
  name: string;
  status: "open" | "closed" | "upcoming";
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eligibleStudents: number;
  totalPositions: number;
  participation: number;
}

export interface ElectionPosition {
  id: string;
  name: string;
  order: number;
  candidates: ElectionCandidate[];
}

export interface ElectionCandidate {
  id: string;
  name: string;
  department: string;
  year: string;
  photoInitials: string;
  campaignSymbol: string;
  shortManifesto: string;
}

export interface CastVotePayload {
  selections: Record<string, string | null>;
}

export interface VoteResponse {
  success: boolean;
  voteId: string;
  receiptHash: string;
  nullifier: string;
  timestamp: string;
}

export const electionApi = {
  getCurrent: () => api.get<Election>("/elections/current"),
  getPositions: () => api.get<ElectionPosition[]>("/elections/positions"),
  castVote: (data: CastVotePayload) => api.post<VoteResponse>("/elections/vote", data),
  getResults: () => api.get("/elections/results"),
  getParticipation: () => api.get("/elections/participation"),
};
