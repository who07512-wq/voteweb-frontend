"use client";

// Mock candidate data for CampusVote Module 3
// 12 fictional candidates across multiple positions and departments

export type CandidatePosition = 
  | "President" 
  | "Vice President" 
  | "General Secretary" 
  | "Treasurer" 
  | "Cultural Secretary";

export type CandidateDepartment = 
  | "BCA" 
  | "BBA" 
  | "B.Tech" 
  | "B.Com" 
  | "Economics"
  | "Fine Arts"
  | "Mass Communication"
  | "Other";

export type CandidateYear = 
  | "1st Year" 
  | "2nd Year" 
  | "3rd Year" 
  | "4th Year";

export interface ManifestoSection {
  title: string;
  content: string;
}

export interface Candidate {
  id: string;
  name: string;
  position: CandidatePosition;
  department: CandidateDepartment;
  year: CandidateYear;
  photoInitials: string;
  campaignSymbol: string;
  verified: boolean;
  biography: string;
  manifestos: ManifestoSection[];
}

export const CANDIDATES: Candidate[] = [];