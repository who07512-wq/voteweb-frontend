"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { hasRollNumber } from "@/lib/roll-number";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

type BridgeStep = "checking" | "success" | "error";

/**
 * Clerk → backend session bridge.
 *
 * Runs after Google sign-in (Clerk redirects back here). Exchanges the Clerk
 * session for a backend session (cv_sid cookie) via POST /auth/clerk-session,
 * then routes to the role dashboard (capturing the roll number first if the
 * user has never provided one).
 */
function ClerkCallbackInner() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<BridgeStep>("checking");
  const [errorMsg, setErrorMsg] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    if (!isLoaded) return;
    started.current = true;

    (async () => {
      try {
        if (!isSignedIn || !user) {
          setErrorMsg("You are not signed in. Please start again from the login page.");
          setStep("error");
          return;
        }

        // Primary email address from the Clerk (Google) profile
        const primaryEmail =
          user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress;
        if (!primaryEmail) {
          setErrorMsg("Your Google account has no email address to sign in with.");
          setStep("error");
          return;
        }

        // Session token (JWT) - verified server-side against Clerk's JWKS
        const token = await getToken();

        // Role chosen on the login page
        const role = sessionStorage.getItem("campusvote_login_role") || "student";

        // CSRF token for the backend
        const csrfRes = await fetch(`${API_BASE}/auth/csrf`, { credentials: "include" });
        const csrfData = await csrfRes.json();
        const csrfToken = csrfData.data?.csrfToken || "";

        const res = await fetch(`${API_BASE}/auth/clerk-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({
            email: primaryEmail,
            name: user.fullName || user.firstName || "",
            role: role.toUpperCase(),
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setErrorMsg(data.error?.message || "Sign-in bridge failed. Please try again.");
          setStep("error");
          return;
        }

        // Persist binding token for authenticated writes
        if (data.data?.bindingToken) {
          try {
            const { setBindingToken } = await import("@/lib/session-binding");
            setBindingToken(data.data.bindingToken);
          } catch {
            /* non-fatal */
          }
        }

        sessionStorage.removeItem("campusvote_login_role");
        setStep("success");

        // One-time roll number capture, then dashboard
        const dashboards: Record<string, string> = {
          student: "/student/dashboard",
          candidate: "/candidate/dashboard",
          administrator: "/admin/dashboard",
        };
        const dest = dashboards[role] || "/student/dashboard";
        const needsRoll =
          (role === "student" || role === "candidate") &&
          !hasRollNumber(role, primaryEmail);

        setTimeout(() => {
          if (needsRoll) {
            router.replace(
              `/roll-number?role=${role}&email=${encodeURIComponent(primaryEmail)}&next=${encodeURIComponent(dest)}`
            );
          } else {
            router.replace(dest);
          }
        }, 800);
      } catch (err) {
        console.error("Clerk callback bridge failed:", err);
        setErrorMsg("Something went wrong completing sign-in. Please try again.");
        setStep("error");
      }
    })();
  }, [isLoaded, isSignedIn, user, getToken, router]);

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center py-8">
          {step === "checking" && (
            <>
              <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Completing sign-in...
              </h2>
              <p className="text-sm text-gray-500">Setting up your secure session</p>
            </>
          )}
          {step === "success" && (
            <>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Signed in!</h2>
              <p className="text-sm text-gray-500">Taking you to your dashboard...</p>
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

export default function ClerkCallbackPage() {
  return <ClerkCallbackInner />;
}
