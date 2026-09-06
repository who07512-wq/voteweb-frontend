"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/api/v1";
import { Loader2 } from "lucide-react";

const ROLE_ROUTE: Record<string, string> = {
  STUDENT: "/student/dashboard",
  CANDIDATE: "/candidate/dashboard",
  CAD: "/cad/dashboard",
  ADMIN: "/admin/dashboard",
};

/**
 * Root — sends already-authenticated users to their role's dashboard and
 * everyone else to /login. The backend session (getMe) is the source of
 * truth for the role, never client state.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (cancelled) return;
        if (me.authenticated && me.user) {
          const role = String(me.user.role || "").toUpperCase();
          router.replace(ROLE_ROUTE[role] || "/student/dashboard");
          return;
        }
        router.replace("/login");
      } catch {
        if (!cancelled) router.replace("/login");
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
        <p className="text-sm text-gray-600">Checking your session…</p>
      </div>
    </div>
  );
}