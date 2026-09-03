import type { ApplicationStatus } from "./candidate-dashboard-data";
import { candidateApi } from "./api/candidates";
import type { Candidate } from "./candidate-data";
import type { VotingPosition, VotingCandidate } from "./election-voting-data";

export interface CandidateApplicationData {
  id: string;
  name: string;
  enrollmentNumber: string;
  department: string;
  year: string;
  section: string;
  position: string;
  email: string;
  phone: string;
  photo: string | null;
  bio: string;
  manifesto: string;
  status: ApplicationStatus;
  rejectionReason: string | null;
  adminNote: string | null;
  submittedDate: string | null;
  reviewedDate: string | null;
}

export const POSITION_OPTIONS = [
  "President",
  "Vice President",
  "General Secretary",
  "Treasurer",
  "Cultural Secretary",
  "Sports Secretary",
];

export const DEPARTMENT_OPTIONS = ["BCA", "BBA", "BSc IT", "BSc CS", "B.Com", "BA"];

export const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export const SECTION_OPTIONS = ["A", "B", "C", "D", "E", "F"];

export async function getApplicationByEmail(email: string): Promise<CandidateApplicationData | undefined> {
  try {
    const all: any = await candidateApi.getAll();
    const apps = all?.data || all || [];
    if (Array.isArray(apps)) {
      return apps.find((a: any) => a.email?.toLowerCase() === email.toLowerCase());
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function getAllApplications(): Promise<CandidateApplicationData[]> {
  try {
    const all: any = await candidateApi.getAll();
    return all?.data || all || [];
  } catch {
    return [];
  }
}

export async function getApprovedCandidatesAsCandidateList(): Promise<Candidate[]> {
  try {
    const all: any = await candidateApi.getApproved();
    const apps = all?.data || all || [];
    return apps.map((app: any) => ({
      id: app.id || app.studentId,
      name: app.name,
      position: app.position,
      photo: app.photo,
      bio: app.bio || app.manifesto,
    }));
  } catch {
    return [];
  }
}

export async function getApprovedCandidatesAsVotingPositions(): Promise<VotingPosition[]> {
  try {
    const all: any = await candidateApi.getApproved();
    const apps = all?.data || all || [];

    // Group by position
    const byPosition: Record<string, any[]> = {};
    for (const app of apps) {
      const pos = app.position || "General";
      if (!byPosition[pos]) byPosition[pos] = [];
      byPosition[pos].push(app);
    }

    // Convert to VotingPosition format
    const positions: VotingPosition[] = [];
    let order = 1;
    for (const [posName, candidates] of Object.entries(byPosition)) {
      const votingCandidates: VotingCandidate[] = candidates.map((c: any) => ({
        id: c.id || c.studentId,
        name: c.name,
        department: c.department || "",
        year: c.year || "",
        photoInitials: (c.name || "?").substring(0, 2).toUpperCase(),
        campaignSymbol: "⭐",
        shortManifesto: (c.manifesto || c.bio || "").substring(0, 100),
      }));

      positions.push({
        id: `pos-${order}`,
        name: posName,
        order: order++,
        candidates: votingCandidates,
      });
    }

    return positions;
  } catch {
    return [];
  }
}

export async function submitApplication(
  data: Omit<CandidateApplicationData, "id" | "status" | "rejectionReason" | "adminNote" | "submittedDate" | "reviewedDate">
): Promise<CandidateApplicationData> {
  const result: any = await candidateApi.submit({
    name: data.name,
    enrollmentNumber: data.enrollmentNumber,
    department: data.department,
    year: data.year,
    section: data.section,
    position: data.position,
    email: data.email,
    phone: data.phone,
    photo: data.photo,
    bio: data.bio,
    manifesto: data.manifesto,
  });
  return result?.data || result;
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  rejectionReason?: string
): Promise<CandidateApplicationData> {
  const result: any = await candidateApi.updateStatus(id, {
    status,
    reason: rejectionReason
  });
  return result?.data || result;
}
