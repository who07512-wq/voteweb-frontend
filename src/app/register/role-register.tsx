"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Loader2,
  Mail,
  UserPlus,
  Hash,
  Mic,
  Phone,
  Lock,
} from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { setBindingToken } from "@/lib/session-binding";
import { setAuthCookie } from "@/lib/mock-auth";
import { saveRollNumber } from "@/lib/roll-number";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const DASHBOARDS: Record<string, string> = {
  STUDENT: "/student/dashboard",
  CANDIDATE: "/candidate/dashboard",
  ADMIN: "/admin/dashboard",
  CAD: "/cad/dashboard",
};

type Stage = "form" | "code";
export type RegisterPortal = "any" | "candidate" | "student";

const PORTAL_TITLES: Record<RegisterPortal, string> = {
  any: "Create your account",
  candidate: "Candidate Registration",
  student: "Student Registration",
};

export function RoleRegisterPage({ portal }: { portal: RegisterPortal }) {
  const [selectedRole] = useState<"candidate" | "student">("candidate");

  const [stage, setStage] = useState<Stage>("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const validateForm = (): string | null => {
    if (fullName.trim().length < 2) return "Enter your full name.";
    if (!email || !email.includes("@")) return "Enter a valid email address.";
    if (!rollNumber.trim()) return "Enter your roll / enrollment number.";
    const phoneDigits = phone.replace(/[\s()-]/g, "");
    if (!/^\+?[0-9]{10,15}$/.test(phoneDigits))
      return "Enter a valid phone number (10-15 digits).";
    if (!password || password.length < 12)
      return "Password must be at least 12 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const csrfFetch = async (url: string, opts: RequestInit = {}) => {
    const csrfRes = await fetch(`${API_BASE}/auth/csrf`, { credentials: "include" });
    const csrfData = await csrfRes.json().catch(() => ({}));
    const csrfToken = csrfData.data?.csrfToken || "";
    return fetch(url, {
      ...opts,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
        ...(opts.headers as Record<string, string> || {}),
      },
    });
  };

  const startRegistration = async () => {
    setError("");
    const invalid = validateForm();
    if (invalid) {
      setError(invalid);
      return;
    }
    setIsSending(true);
    try {
      const normalized = email.trim().toLowerCase();
      const res = await csrfFetch(`${API_BASE}/auth/register/otp`, {
        method: "POST",
        body: JSON.stringify({
          email: normalized,
          username: rollNumber.trim(),
          password,
          confirmPassword,
          role: selectedRole.toUpperCase(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        console.error("Register OTP send failed:", data.error || res.status);
        setError(data.error?.message || "We couldn't send the verification code. Please try again.");
        setIsSending(false);
        return;
      }

      setStage("code");
      setIsSending(false);
    } catch (err) {
      console.error("startRegistration threw:", err);
      setError("We couldn't start registration. Please check your connection and try again.");
      setIsSending(false);
    }
  };

  const verifyCode = async () => {
    setError("");
    if (!code || code.trim().length < 4) {
      setError("Enter the code you received by email.");
      return;
    }
    setIsVerifying(true);
    try {
      const normalized = email.trim().toLowerCase();
      const res = await csrfFetch(`${API_BASE}/auth/register/verify`, {
        method: "POST",
        body: JSON.stringify({
          email: normalized,
          otp: code.trim(),
          username: rollNumber.trim(),
          fullName: fullName.trim(),
          mobileNumber: phone.replace(/[\s()-]/g, ""),
          enrollmentNumber: rollNumber.trim(),
          password,
          role: selectedRole.toUpperCase(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        console.error("Register verify failed:", data.error || res.status);
        setError(data.error?.message || "Invalid or expired code. Please try again.");
        setIsVerifying(false);
        return;
      }

      const result = data.data;

      if (result.authenticated) {
        if (result.bindingToken) setBindingToken(result.bindingToken);
        if (result.user) {
          setAuthCookie(result.user.role || selectedRole.toUpperCase(), result.user.name || fullName, result.user.email || normalized);
        }
        if (rollNumber.trim()) {
          saveRollNumber("student", normalized, rollNumber.trim());
        }
        const role = String(result.user?.role || "STUDENT").toUpperCase();
        const dest =
          role === "STUDENT" && rollNumber.trim() ? "/candidate/apply" : DASHBOARDS[role] || "/student/dashboard";
        window.location.href = dest;
        return;
      }

      setError("Something unexpected happened. Please try again.");
      setIsVerifying(false);
    } catch (err) {
      console.error("verifyCode threw:", err);
      setError("Something went wrong verifying the code. Please try again.");
      setIsVerifying(false);
    }
  };

  const resendCode = () => {
    setCode("");
    setError("");
    startRegistration();
  };

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center mb-6">
          <AuthHeader
            title={PORTAL_TITLES[portal]}
            subtitle="Register to apply as a candidate — verify your email with a one-time code"
          />
        </div>

        {notice && (
          <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg text-primary-800 text-sm break-words">
            {notice}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/login" className="font-medium underline">
                Sign in instead
              </Link>
              <Link href="/email-recovery" className="font-medium underline">
                Can't access your email?
              </Link>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm break-words">
            {error}
          </div>
        )}

        {stage === "form" && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 text-center flex items-center justify-center gap-2">
              <Mic className="w-4 h-4 shrink-0" />
              <span>
                Registering as <strong>Candidate</strong>
              </span>
            </div>

            <Input
              id="register-name"
              label="Full name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") startRegistration();
              }}
            />
            <Input
              id="register-email"
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative">
              <Input
                id="register-roll"
                label="Roll / enrollment number"
                type="text"
                autoComplete="off"
                placeholder="e.g. 0221IT211045"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
              />
              <Hash className="w-3.5 h-3.5 text-text-muted absolute right-3 top-9" />
            </div>
            <div className="relative">
              <Input
                id="register-phone"
                label="Phone number"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Phone className="w-3.5 h-3.5 text-text-muted absolute right-3 top-9" />
            </div>
            <div className="relative">
              <Input
                id="register-password"
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 12 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock className="w-3.5 h-3.5 text-text-muted absolute right-3 top-9" />
            </div>
            <Input
              id="register-confirm-password"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") startRegistration();
              }}
            />
            <Button
              onClick={startRegistration}
              disabled={isSending}
              isLoading={isSending}
              className="w-full"
            >
              {!isSending && (
                <>
                  <UserPlus className="w-4 h-4" />
                  Register
                </>
              )}
            </Button>

            <p className="text-xs text-text-secondary text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
            <p className="text-xs text-text-muted text-center">
              Student registration is temporarily closed. Administrator accounts are not
              self-registered — sign in at{" "}
              <Link href="/login/admin" className="text-primary-600 hover:text-primary-700 font-medium">
                /login/admin
              </Link>
            </p>
          </div>
        )}

        {stage === "code" && (
          <div className="space-y-4">
            <div className="p-3 bg-primary-50 border border-primary-100 rounded-lg text-sm text-primary-800 flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                We sent a one-time code to <strong>{email}</strong>. Enter it below to verify your email.
              </span>
            </div>
            <Input
              id="register-code"
              label="One-time code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") verifyCode();
              }}
            />
            <Button
              onClick={verifyCode}
              disabled={isVerifying}
              isLoading={isVerifying}
              className="w-full"
            >
              {!isVerifying && (
                <>
                  <UserPlus className="w-4 h-4" />
                  Verify & Create Account
                </>
              )}
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-text-secondary">
              <button
                type="button"
                onClick={resendCode}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => {
                  setStage("form");
                  setCode("");
                  setError("");
                  setNotice("");
                }}
                className="text-text-muted hover:text-text-secondary font-medium"
              >
                Use a different email
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border text-xs text-text-secondary text-center flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 leading-relaxed px-1">
          {isVerifying ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : (
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>
            Your email is verified with a one-time code. After registering, sign in with your
            password or a fresh code sent to this email.
          </span>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
