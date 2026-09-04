"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { hasRollNumber } from "@/lib/roll-number";
import { HelpCircle, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { RoleSelector } from "@/components/auth/RoleSelector";
import type { UserRole } from "@/lib/auth-types";

/**
 * Google-only sign-in via Clerk.
 *
 * After Clerk authenticates the Google session, we hop to /auth/clerk-callback
 * which exchanges the Clerk session for a backend session (cv_sid cookie) via
 * POST /auth/clerk-session, then routes to the role dashboard.
 *
 * The OTP email flow was removed (no mail provider configured).
 */
function LoginPageInner() {
  const { isLoaded, signIn } = useSignIn();
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const startGoogleSignIn = async () => {
    setError("");
    if (!isLoaded || !signIn) {
      setError("Sign-in is still loading. Please try again in a moment.");
      return;
    }
    setIsLoading(true);
    try {
      // Store the chosen role for the callback page (sessionStorage is
      // per-tab and dies with the tab - no stale roles across sessions).
      sessionStorage.setItem("campusvote_login_role", selectedRole);

      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/auth/clerk-callback",
        redirectUrlComplete: "/auth/clerk-callback",
      });
      // Browser navigates away to Google; nothing else to do here.
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError("Could not start Google sign-in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center mb-6">
          <AuthHeader
            title="Sign In"
            subtitle="Use your institute Google account to continue"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <RoleSelector
            selectedRole={selectedRole}
            onSelect={setSelectedRole}
          />

          <button
            onClick={startGoogleSignIn}
            disabled={isLoading || !isLoaded}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2 text-gray-700">
                <Loader2 className="w-5 h-5 animate-spin" />
                Redirecting to Google...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
                  />
                </svg>
                <span className="font-medium text-gray-700">
                  Continue with Google
                </span>
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            Students, candidates, and administrators all sign in with Google.
            First-time users will be asked for their roll number once.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200 mt-6">
          <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-500">
            <Link href="/student/help" className="flex items-center gap-1 hover:text-primary-600">
              <HelpCircle className="w-3.5 h-3.5" />
              Help
            </Link>
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
