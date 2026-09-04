"use client";

import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { PauseCircle } from "lucide-react";

/**
 * Student portal is temporarily closed for the election rollout.
 * Everyone signs in through the main login page for now.
 */
export default function Page() {
  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center mb-6">
          <AuthHeader title="Student Portal" subtitle="The student portal is temporarily closed" />
        </div>

        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex gap-3 items-start">
          <PauseCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">Sign-in here is disabled for now.</p>
            <p>
              Please use the main sign-in page — all roles (including students) currently
              sign in there. Admin and CAD portals remain open.
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
        >
          Go to the main sign-in page
        </Link>
      </AuthCard>
    </AuthLayout>
  );
}
