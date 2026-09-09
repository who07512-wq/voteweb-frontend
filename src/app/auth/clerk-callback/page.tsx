"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { setAuthCookie } from "@/lib/mock-auth";
import { getDashboardRoute } from "@/lib/dashboard-route";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const [step, setStep] = useState<"routing" | "error">("routing");
  const [errorMsg, setErrorMsg] = useState("");
  const redirect = searchParams.get("redirect") || "";

  useEffect(() => {
    const run = async () => {
      try {
        // 1. If the OTP flow already set the auth cookie, route directly.
        const authCookie = document.cookie.match(/campusvote_auth=([^;]+)/);
        if (authCookie) {
          const auth = JSON.parse(decodeURIComponent(authCookie[1]));
          const role = String(auth.role || "STUDENT").toUpperCase();
          const dest = getDashboardRoute(role);
          sessionStorage.removeItem("campusvote_login_role");
          sessionStorage.removeItem("campusvote_pending_email");
          sessionStorage.removeItem("campusvote_pending_role");
          sessionStorage.removeItem("campusvote_dest");
          setTimeout(() => router.replace(dest), 300);
          return;
        }

        // 2. OAuth flow: get Clerk session token and bridge to backend.
        if (!isSignedIn || !getToken) {
          setErrorMsg("No active Clerk session. Please sign in again.");
          setStep("error");
          return;
        }

        const token = await getToken();
        if (!token) {
          setErrorMsg("Could not retrieve session token. Please sign in again.");
          setStep("error");
          return;
        }

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

        // First fetch CSRF token
        const csrfRes = await fetch(`${backendUrl}/auth/csrf`, {
          credentials: "include",
        });
        const csrfData = await csrfRes.json().catch(() => ({}));
        const csrfToken = csrfData.data?.csrfToken || "";

        const res = await fetch(`${backendUrl}/auth/clerk-session`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: user?.fullName || user?.firstName || user?.username || "",
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const msg = typeof data.error === "string"
            ? data.error
            : data.error?.message || "Failed to create session. Please try again.";
          setErrorMsg(msg);
          setStep("error");
          return;
        }

        const data = await res.json();
        const backendUser = data.data?.user || {};
        const role = String(backendUser.role || "STUDENT").toUpperCase();
        const email = backendUser.email || "";

        const name = user?.fullName || user?.firstName || user?.username || "";

        // Store role in cookie for callback and other pages (same format as login page)
        setAuthCookie(role as any, name, email);

        // Check the redirect param
        let dest: string;

        if (redirect === "/register") {
          // OAuth from register page: user is new, go to info form
          dest = "/register?stage=info";
        } else {
          dest = getDashboardRoute(role);

          // Students on candidate portal go to application form
          const loginRole = sessionStorage.getItem("campusvote_login_role") || "student";
          if (role === "STUDENT" && loginRole === "candidate") {
            dest = "/candidate/apply";
          }
        }

        // Clean up session storage
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
    };

    run();
  }, [router, getToken, isSignedIn, redirect]);

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

/**
 * Post-login callback page. Handles both:
 * 1. OTP flow: cookie already set by login/register pages
 * 2. OAuth flow: get Clerk session token, bridge to backend, then route
 */
export default function ClerkCallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <AuthCard>
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Loading...
              </h2>
            </div>
          </AuthCard>
        </AuthLayout>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
