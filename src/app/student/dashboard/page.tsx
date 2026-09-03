"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { User, BookOpen } from "lucide-react";
import { studentApi } from "@/lib/api/students";
import { electionApi } from "@/lib/api/elections";
import type { StudentProfile, Election } from "@/lib/api";
import { getAuthCookie } from "@/lib/mock-auth";

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      studentApi.getProfile().catch(() => null),
      electionApi.getCurrent().catch(() => null),
    ]).then(([profileData, electionData]: [any, any]) => {
      setProfile(profileData?.data || profileData || null);
      setElection(electionData?.data || electionData || null);
      setLoading(false);
    });
  }, []);

  const firstName = profile?.name?.split(" ")[0] || "Student";

  if (loading) {
    return (
      <StudentLayout>
        <div className="max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 dark:bg-[#252540] rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-[#252540] rounded animate-pulse" />
            </div>
            <div className="h-8 w-40 bg-gray-200 dark:bg-[#252540] rounded-xl animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-28 bg-gray-200 dark:bg-[#252540] rounded-2xl animate-pulse" />
            <div className="h-28 bg-gray-200 dark:bg-[#252540] rounded-2xl animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-28 bg-gray-200 dark:bg-[#252540] rounded-xl animate-pulse" />
            <div className="h-28 bg-gray-200 dark:bg-[#252540] rounded-xl animate-pulse" />
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      {error && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Hello, {firstName}!
            </h1>
            <p className="text-sm text-text-secondary">
              Welcome back to Don Bosco Institute of Technology.
            </p>
          </div>
          <div className="text-xs font-bold text-text-muted bg-primary-50 border border-primary-100 px-3 py-1.5 rounded-xl w-fit">
            IP Secured &bull; Session Active
          </div>
        </div>

        {election ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#252540] rounded-2xl p-5 border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-text-primary">{election.name}</h2>
              <p className="text-sm text-text-secondary mt-1">
                Voting period: {new Date(election.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} &ndash; {new Date(election.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} &bull; {election.endTime}
              </p>
            </div>
            <div className="rounded-2xl bg-primary-50 text-center p-6 border border-primary-100">
              <span className="text-3xl font-bold text-primary-600">{election.eligibleStudents.toLocaleString()}</span>
              <span className="text-sm text-text-secondary ml-2">Eligible Voters</span>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#252540] rounded-2xl p-5 border border-border shadow-sm">
            <p className="text-sm text-text-secondary">No upcoming election found.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Link href="/student/vote">
            <div className="p-4 rounded-xl bg-white dark:bg-[#252540] border border-border hover:bg-primary-50 hover:border-primary-200 cursor-pointer transition-colors shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center mb-3">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <h4 className="font-medium text-text-primary">Vote</h4>
              <p className="text-xs text-text-secondary">Cast your vote</p>
            </div>
          </Link>
          <Link href="/student/candidates">
            <div className="p-4 rounded-xl bg-white dark:bg-[#252540] border border-border hover:bg-primary-50 hover:border-primary-200 cursor-pointer transition-colors shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5 text-primary-600" />
              </div>
              <h4 className="font-medium text-text-primary">Candidates</h4>
              <p className="text-xs text-text-secondary">View candidates</p>
            </div>
          </Link>
        </div>

        <div className="bg-white dark:bg-[#252540] rounded-2xl p-4 border border-border shadow-sm">
          <p className="text-sm text-text-secondary">No recent activity</p>
        </div>
      </div>
    </StudentLayout>
  );
}
