"use client";

import React from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";

/**
 * Password reset is not applicable: CampusVote signs in exclusively with
 * Google (Clerk). This page explains that instead of offering a dead form.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center py-6">
          <KeyRound className="w-10 h-10 text-primary-600 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">No password needed</h1>
          <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
            CampusVote uses <strong>Google sign-in</strong> — there is no password to reset.
            Sign in with your Google account instead; your email ownership is verified by Google.
          </p>
          <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
            Can&apos;t access the email on your student record? Use the email recovery request.
          </p>
          <div className="flex flex-col gap-2 items-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
            >
              Go to sign in
            </Link>
            <Link href="/email-recovery" className="text-xs text-primary-600 hover:text-primary-700 hover:underline">
              Can&apos;t access your registered email?
            </Link>
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
