"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CandidateSidebar } from "./CandidateSidebar";
import { CandidateNavbar } from "./CandidateNavbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { getAuthCookie } from "@/lib/mock-auth";
import { getApplicationByEmail } from "@/lib/candidate-application-store";
import type { ApplicationStatus } from "@/lib/candidate-dashboard-data";

export interface CandidateLayoutProps {
  children: React.ReactNode;
  candidateName?: string;
  candidateId?: string;
}

const PROTECTED_ROUTES = [
  "/candidate/dashboard",
  "/candidate/profile",
  "/candidate/campaign",
  "/candidate/manifesto",
  "/candidate/preview",
  "/candidate/settings",
  "/student/help",
];

function canAccessRoute(pathname: string, status: ApplicationStatus): boolean {
  if (status === "approved") return true;

  if (pathname.startsWith("/candidate/status")) return true;
  if (pathname.startsWith("/candidate/apply")) {
    return status === "draft" || status === "changes_requested";
  }

  return !PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
}

export const CandidateLayout: React.FC<CandidateLayoutProps> = ({
  children,
  candidateName,
  candidateId,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [status, setStatus] = useState<ApplicationStatus>("approved");
  const [checking, setChecking] = useState(true);
  const [userName, setUserName] = useState(candidateName || "Candidate");
  const [userId, setUserId] = useState(candidateId || "");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const auth = getAuthCookie();
    let foundName = false;
    let foundId = false;

    if (auth?.email) {
      getApplicationByEmail(auth.email).then((app) => {
        if (app) {
          setUserName(app.name);
          setUserId(app.id);
          setStatus(app.status);
          foundName = true;
          foundId = true;
        }
      });
    }

    if (!foundName) {
      setUserName("Candidate");
    }
    if (!foundId) {
      setUserId("");
    }

    let currentStatus: ApplicationStatus = "draft";

    try {
      const stored = localStorage.getItem("campusvote_application_status");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.status) currentStatus = parsed.status;
      }
    } catch {}

    setStatus(currentStatus);

    if (!canAccessRoute(pathname, currentStatus)) {
      router.replace("/candidate/status");
      return;
    }

    setChecking(false);
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="flex h-screen bg-bg-primary items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <div className="hidden lg:flex">
        <CandidateSidebar status={status} />
      </div>
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        customSidebar={
          <CandidateSidebar
            className="w-full h-full border-r-0 rounded-none"
            onNavigate={() => setMobileNavOpen(false)}
            status={status}
          />
        }
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <CandidateNavbar
          onToggleMenu={() => setMobileNavOpen((prev) => !prev)}
          candidateName={userName}
          candidateId={userId}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
