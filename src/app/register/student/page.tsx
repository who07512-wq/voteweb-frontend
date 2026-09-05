"use client";

import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { PauseCircle } from "lucide-react";

/**
 * Student registration is temporarily closed for the election rollout,
 * mirroring the student login portal. Registration currently happens
 * through the main register page (CAD) only.
 */
export default function Page() {
  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center mb-6">
          <AuthHeader title="Student Registration" subtitle="Student registration is temporarily closed" />
        </div>

        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex gap-3 items-start">
          <PauseCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">Registration here is disabled for now.</p>
            <p>
              Student accounts are currently provisioned by the election administrator.
              If you already have an account, sign in with your email and password instead.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/login"
            className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
          >
            Go to sign in
          </Link>
          <Link
            href="/register/cad"
            className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg border border-border text-text-primary font-medium hover:bg-primary-50/50 transition"
          >
            Register as CAD instead
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
