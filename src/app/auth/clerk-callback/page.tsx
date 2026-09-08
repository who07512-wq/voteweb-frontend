"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { hasRollNumber } from "@/lib/roll-number";
import { getDashboardRoute } from "@/lib/dashboard-route";

/**
 * Post-login callback page. After OTP verification, the login/register pages
 * set the binding token and auth cookie, then redirect here. This page reads
 * the role from the auth cookie and routes to the correct dashboard.
 */
export default function ClerkCallbackPage() {
  const router = useRouter();
  const [step, setStep] = useState<"routing" | "error">("routing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    try {
      const authCookie = document.cookie.match(/campusvote_auth=([^;]+)/);
      if (!authCookie) {
        setErrorMsg("No active session found. Please sign in again.");
        setStep("error");
        return;
      }

      const auth = JSON.parse(decodeURIComponent(authCookie[1]));
      const role = String(auth.role || "STUDENT").toUpperCase();
      const email = auth.email || "";

      let dest = getDashboardRoute(role);

      // Students on candidate portal go to application form
      const loginRole = sessionStorage.getItem("campusvote_login_role") || "student";
      if (role === "STUDENT" && loginRole === "candidate") {
        dest = "/candidate/apply";
      }

      // Check if roll number is needed
      const rollRole = loginRole === "candidate" ? "candidate" : "student";
      const otherRollRole = rollRole === "candidate" ? "student" : "candidate";
      const needsRoll =
        (role === "STUDENT" || role === "CANDIDATE") &&
        email &&
        !hasRollNumber(rollRole, email) &&
        !hasRollNumber(otherRollRole, email);

      if (needsRoll && email) {
        dest = `/roll-number?role=${rollRole}&email=${encodeURIComponent(email)}&next=${encodeURIComponent(dest)}`;
      }

      // Clean up
      sessionStorage.removeItem("campusvote_login_role");
      sessionStorage.removeItem("campusvote_pending_email");
      sessionStorage.removeItem("campusvote_pending_role");
      sessionStorage.removeItem("campusvote_dest");

      setTimeout(() => router.replace(dest), 300);
    } catch (err) {
      console.error("Callback routing failed:", err);
      setErrorMsg("Something went wrong. Please try signing in again.");
      setStep("error");
    }
  }, [router]);

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center py-8">
          {step === "routing" && (
            <>
              <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Taking you to your dashboard...
              </h2>
            </>
          )}
          {step === "error" && (
            <>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign-in failed</h2>
              <p className="text-sm text-gray-500 mb-6">{errorMsg}</p>
              <a
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
              >
                Back to login
              </a>
            </>
          )}
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
