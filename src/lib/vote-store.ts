import { createHash, randomBytes } from "crypto";
import { positions } from "@/lib/election-data";

export interface VoteRecord {
  id: string;
  studentId: string;
  selections: Record<string, string>;
  timestamp: string;
  receiptHash: string;
  nullifier: string;
}

export const voteStore = new Map<string, VoteRecord>();

export function generateReceiptHash(vote: VoteRecord): string {
  const data = `${vote.studentId}:${JSON.stringify(vote.selections)}:${vote.timestamp}:${vote.nullifier}`;
  return createHash("sha256").update(data).digest("hex");
}

export function generateNullifier(): string {
  return randomBytes(16).toString("hex");
}

export function validateSelections(selections: Record<string, string>): { valid: boolean; error?: string } {
  for (const position of positions) {
    if (!selections[position.id]) {
      return { valid: false, error: `Missing selection for ${position.title}` };
    }
    const candidate = position.candidates.find((c) => c.id === selections[position.id]);
    if (!candidate) {
      return { valid: false, error: `Invalid candidate for ${position.title}` };
    }
  }
  return { valid: true };
}