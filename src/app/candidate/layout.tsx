"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { hasRollNumber } from "@/lib/roll-number";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  // Candidates must provide their roll number once after signing in.
  useEffect(() => {
    if (!isLoaded || !user) return;
    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;
    if (hasRollNumber("candidate", email)) return;
    const next = pathname?.startsWith("/") ? pathname : "/candidate/dashboard";
    router.replace(
      `/roll-number?role=candidate&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`
    );
  }, [isLoaded, user, pathname, router]);

  return <>{children}</>;
}