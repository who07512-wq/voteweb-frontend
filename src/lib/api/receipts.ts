import { api } from "./client";

export interface Receipt {
  id: string;
  voteId: string;
  receiptHash: string;
  nullifier: string;
  timestamp: string;
  verified: boolean;
  verificationUrl: string;
  receiptId: string;
}

export interface ReceiptHistoryItem {
  id: string;
  electionName: string;
  date: string;
  receiptHash: string;
  verified: boolean;
}

export const receiptApi = {
  verify: (hash: string) => api.get<Receipt>(`/receipts/verify?hash=${hash}`),
  getByVoteId: (voteId: string) => api.get<Receipt>(`/receipts?voteId=${voteId}`),
  getHistory: () => api.get<ReceiptHistoryItem[]>("/receipts/history"),
};
