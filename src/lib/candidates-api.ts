"use client";

// Typed client for the real candidates endpoints (voteweb-backend /api/v1).
// Maps backend rows onto the UI Candidate model used by the candidate pages.

import { api } from "@/lib/api/client";
import type { Candidate } from "@/lib/candidate-data";

interface CandidateRow {
  id: number;
  name: string;
  description?: string | null;
  position_name?: string | null;
  club_name?: string | null;
  image_url?: string | null;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

function toCandidate(row: CandidateRow): Candidate {
  const bio = row.description || "";
  return {
    id: String(row.id),
    name: row.name || "",
    position: (row.position_name || "Other") as Candidate["position"],
    department: (row.club_name || "") as Candidate["department"],
    year: "" as Candidate["year"],
    photoInitials: initialsOf(row.name || ""),
    campaignSymbol: "",
    verified: true,
    biography: bio,
    manifestos: bio ? [{ title: "Overview", content: bio }] : [],
  };
}

/** GET /candidates - all active candidates (public). */
export async function listCandidates(): Promise<Candidate[]> {
  const rows = await api.get<CandidateRow[]>("/candidates");
  return (rows || []).map(toCandidate);
}

/** GET /candidates/:id - single candidate (public). Returns null on miss. */
export async function getCandidate(id: string): Promise<Candidate | null> {
  try {
    const row = await api.get<CandidateRow>(`/candidates/${id}`);
    return row ? toCandidate(row) : null;
  } catch {
    return null;
  }
}

/** Fetch several candidates by id (used by the compare page). */
export async function getCandidatesByIds(ids: string[]): Promise<Candidate[]> {
  if (!ids.length) return [];
  const all = await listCandidates();
  const wanted = new Set(ids);
  return all.filter((c) => wanted.has(c.id));
}