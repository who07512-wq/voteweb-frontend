"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { HelpCircle, Loader2, ShieldAlert } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { RoleSelector } from "@/components/auth/RoleSelector";
import type { UserRole } from "@/lib/auth-types";

/**
 * Shared login portal implementation used by /login, /login/student,
 * /login/cad and /login/admin. The `portal` prop preselects (and for
 * non-student portals locks) the role; the backend still verifies the
 * DB role after Google returns.
 */
export function RoleLoginPage({ portal }: { portal: "any" | "student" | "cad" | "admin" }) {
  const { signIn } = useSignIn();
  const isLoaded = Boolean(signIn);
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    portal === "student" ? "student" : portal === "cad" ? "cad" : portal === "admin" ? "administrator" : "student"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState(
    portal === "any" ? "" :
    portal === "admin" ? "Administrator access only — unauthorized sign-in attempts are logged."
    : portal === "cad" ? "CAD (election monitor) access only — unauthorized sign-in attempts are logged."
    : ""
  );
  const [error, setError] = useState("");

  useEffect(() => {
    // Surface role-mismatch rejections relayed by the callback page
    const flagged = sessionStorage.getItem("campusvote_role_mismatch");
    if (flagged) {
      setNotice("");
      setError(
        "This Google account is not authorized for this portal. Sign in from the correct portal for your role."
      );
      sessionStorage.removeItem("campusvote_role_mismatch");
    }
  }, []);

  const startGoogleSignIn = async () => {
    setError("");
    if (!signIn) {
      setError("Sign-in is still loading. Please try again in a moment.");
      return;
    }
    setIsLoading(true);
    try {
      sessionStorage.setItem("campusvote_login_role", selectedRole);
      const { error: ssoError } = await signIn.sso({
        strategy: "oauth_google",
        redirectUrl: "/auth/clerk-callback",
        redirectCallbackUrl: "/auth/clerk-callback",
      });
      if (ssoError) {
        console.error("Google sign-in failed:", ssoError);
        setError("Could not start Google sign-in. Please try again.");
        setIsLoading(false);
      }
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
            title={
              portal === "admin" ? "Admin Portal" :
              portal === "cad" ? "CAD Portal" :
              portal === "student" ? "Student Portal" :
              "Sign In"
            }
            subtitle="Use your institute Google account to continue"
          />
        </div>

        {notice && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            {notice}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {portal === "any" ? (
            <RoleSelector selectedRole={selectedRole} onSelect={setSelectedRole} />
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 text-center">
              Signing in as <strong>{selectedRole}</strong>
            </div>
          )}

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
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
                </svg>
                <span className="font-medium text-gray-700">Continue with Google</span>
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            {portal === "any"
              ? "Students, candidates, and administrators all sign in with Google. First-time users will be asked for their roll number once."
              : "Only accounts with the correct role in the voting system can complete sign-in."}
          </p>

          {portal === "any" && (
            <p className="text-center">
              <Link href="/access-request" className="text-sm text-primary-600 hover:text-primary-700 hover:underline font-medium">
                Request Voting Access
              </Link>
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200 mt-6">
          <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-500">
            <Link href="/student/help" className="flex items-center gap-1 hover:text-primary-600">
              <HelpCircle className="w-3.5 h-3.5" />
              Help
            </Link>
            <Link href="/access-request/status" className="flex items-center gap-1 hover:text-primary-600">
              <ShieldAlert className="w-3.5 h-3.5" />
              Request status
            </Link>
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
