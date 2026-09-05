"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/api/v1";
import { Loader2 } from "lucide-react";

/**
 * Bare /candidate — no page exists here by design. Visitors either wanted
 * the candidate portal (→ /login with the candidate role preselected) or
 * the candidate area (→ /candidate/dashboard when already signed in).
 * Never renders a 404.
 */
export default function CandidateIndexPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (cancelled) return;
        if (me.authenticated && me.user) {
          const role = String(me.user.role || "").toUpperCase();
          if (role === "STUDENT" || role === "CANDIDATE") {
            router.replace("/candidate/dashboard");
            return;
          }
          // Admin/CAD land on their own dashboards instead
          if (role === "ADMIN") {
            router.replace("/admin/dashboard");
            return;
          }
          if (role === "CAD") {
            router.replace("/cad/dashboard");
            return;
          }
        }
        router.replace("/login?role=candidate");
      } catch {
        if (!cancelled) router.replace("/login?role=candidate");
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-3" />
        <p className="text-sm text-gray-600">
          {checked ? "Redirecting to sign in…" : "Checking your session…"}
        </p>
      </div>
    </div>
  );
}
