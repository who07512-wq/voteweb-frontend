import { NextRequest, NextResponse } from "next/server";
import { voteStore, type VoteRecord } from "@/lib/vote-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const receiptHash = searchParams.get("hash");
    const voteId = searchParams.get("voteId");

    if (!receiptHash && !voteId) {
      return NextResponse.json(
        { error: "Missing required parameter: hash or voteId" },
        { status: 400 }
      );
    }

    let voteRecord: VoteRecord | undefined;
    if (voteId) {
      voteRecord = voteStore.get(voteId);
    } else if (receiptHash) {
      voteRecord = Array.from(voteStore.values()).find(
        (v) => v.receiptHash === receiptHash
      );
    }

    if (!voteRecord) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    const response = {
      id: voteRecord.id,
      timestamp: voteRecord.timestamp,
      receiptHash: voteRecord.receiptHash,
      nullifier: voteRecord.nullifier,
      verified: true,
      verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/receipt?hash=${voteRecord.receiptHash}`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Receipt retrieval error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}