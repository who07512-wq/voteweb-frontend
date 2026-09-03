import { NextRequest, NextResponse } from "next/server";
import { positions } from "@/lib/election-data";
import { voteStore, generateReceiptHash, generateNullifier, validateSelections, type VoteRecord } from "@/lib/vote-store";

interface VoteRequest {
  studentId: string;
  selections: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const body: VoteRequest = await request.json();
    const { studentId, selections } = body;

    if (!studentId || !selections) {
      return NextResponse.json(
        { error: "Missing required fields: studentId and selections" },
        { status: 400 }
      );
    }

    const validation = validateSelections(selections);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const existingVote = Array.from(voteStore.values()).find(
      (v) => v.studentId === studentId
    );
    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted in this election" },
        { status: 409 }
      );
    }

    const now = new Date();
    const voteStart = new Date("2026-08-01T09:00:00Z");
    const voteEnd = new Date("2026-08-10T17:00:00Z");

    if (now < voteStart) {
      return NextResponse.json(
        { error: "Voting has not started yet" },
        { status: 400 }
      );
    }
    if (now > voteEnd) {
      return NextResponse.json(
        { error: "Voting has ended" },
        { status: 400 }
      );
    }

    const voteId = `vote-${Date.now()}-${generateNullifier().slice(0, 8)}`;
    const nullifier = generateNullifier();

    const voteRecord: VoteRecord = {
      id: voteId,
      studentId,
      selections,
      timestamp: now.toISOString(),
      receiptHash: "",
      nullifier,
    };

    voteRecord.receiptHash = generateReceiptHash(voteRecord);
    voteStore.set(voteId, voteRecord);

    return NextResponse.json({
      success: true,
      voteId: voteRecord.id,
      receiptHash: voteRecord.receiptHash,
      nullifier: voteRecord.nullifier,
      timestamp: voteRecord.timestamp,
    });
  } catch (error) {
    console.error("Vote submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Vote API endpoint. Use POST to submit a vote.",
    positions: positions.map((p) => ({
      id: p.id,
      title: p.title,
      candidates: p.candidates.map((c) => ({ id: c.id, name: c.name })),
    })),
  });
}