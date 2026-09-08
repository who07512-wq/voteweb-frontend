"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasRollNumber } from "@/lib/roll-number";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const authCookie = document.cookie.match(/campusvote_auth=([^;]+)/);
    if (!authCookie) return;
    try {
      const auth = JSON.parse(decodeURIComponent(authCookie[1]));
      const email = auth.email;
      if (!email) return;
      if (hasRollNumber("candidate", email) || hasRollNumber("student", email)) return;
      const next = pathname?.startsWith("/") ? pathname : "/candidate/dashboard";
      router.replace(
        `/roll-number?role=candidate&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`
      );
    } catch {
      // non-fatal
    }
  }, [pathname, router]);

  return <>{children}</>;
}
