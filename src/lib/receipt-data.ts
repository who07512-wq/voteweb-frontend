"use client";

// Mock receipt data for CampusVote Module 5
// Vote Receipt & Verification

export type ReceiptStatus = "recorded" | "pending" | "invalid" | "not_found" | "error";

export interface VoteReceipt {
  id: string;
  receiptId: string;
  electionName: string;
  status: ReceiptStatus;
  submittedAt: string;
  submittedDate: string;
  submittedTime: string;
  electionStatus: string;
  verificationUrl: string;
}

export interface ReceiptHistoryItem {
  electionName: string;
  receiptId: string;
  status: ReceiptStatus;
  date: string;
}

export const MOCK_RECEIPT: VoteReceipt | null = null;

export const MOCK_RECEIPT_HISTORY: ReceiptHistoryItem[] = [];

export function verifyReceipt(receiptId: string): VoteReceipt | null {
  return null;
}
