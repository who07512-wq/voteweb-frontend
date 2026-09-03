"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HelpCircle, BookOpen, Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { UserRole } from "@/lib/auth-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://vote-main-production.up.railway.app/api/v1";

type LoginStep = "email" | "otp" | "success";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const getDashboardRoute = (role: UserRole): string => {
    switch (role) {
      case "student": return "/student/dashboard";
      case "candidate": return "/candidate/dashboard";
      case "administrator": return "/admin/dashboard";
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setUserEmail(email);

    try {
      // Get CSRF token
      const csrfRes = await fetch(`${API_BASE}/auth/csrf`, {
        credentials: "include",
      });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.data?.csrfToken || "";

      // Send login OTP request
      const res = await fetch(`${API_BASE}/otp/send-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          role: selectedRole.toUpperCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || data.error || "Failed to send OTP");
        setIsLoading(false);
        return;
      }

      // Success - move to OTP step
      setStep("otp");
      setCooldown(60);
      setIsLoading(false);
    } catch (err) {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((d) => d) && newOtp.join("").length === 6) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      handleVerifyOtp(pasted);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setError("");
    await handleSendOtp({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleVerifyOtp = async (fullOtp: string) => {
    setIsLoading(true);
    setError("");

    try {
      // Get CSRF token
      const csrfRes = await fetch(`${API_BASE}/auth/csrf`, {
        credentials: "include",
      });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.data?.csrfToken || "";

      // Verify OTP and login
      const res = await fetch(`${API_BASE}/otp/verify-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          email: userEmail.toLowerCase().trim(),
          otp: fullOtp,
          role: selectedRole.toUpperCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || data.error || "Invalid OTP");
        setOtp(["", "", "", "", "", ""]);
        setIsLoading(false);
        return;
      }

      // Success!
      setStep("success");

      // Redirect after showing success
      setTimeout(() => {
        router.push(getDashboardRoute(selectedRole));
      }, 1500);

      setIsLoading(false);
    } catch (err) {
      setError("Verification failed. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setUserEmail("");
  };

  // ======= EMAIL STEP =======
  if (step === "email") {
    return (
      <AuthLayout>
        <AuthCard>
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary-600" />
            </div>
            <AuthHeader
              title="Sign In"
              subtitle="Enter your email to receive a login code"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSendOtp} className="space-y-4">
            <RoleSelector
              selectedRole={selectedRole}
              onSelect={setSelectedRole}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                "Send Login Code"
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Register
              </Link>
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-500">
              <Link href="/help" className="flex items-center gap-1 hover:text-primary-600">
                <HelpCircle className="w-3.5 h-3.5" />
                Help
              </Link>
              <Link href="/student/guidelines" className="flex items-center gap-1 hover:text-primary-600">
                <BookOpen className="w-3.5 h-3.5" />
                Guidelines
              </Link>
            </div>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  // ======= OTP STEP =======
  if (step === "otp") {
    return (
      <AuthLayout>
        <AuthCard>
          <button
            onClick={handleBackToEmail}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary-600" />
            </div>
            <AuthHeader
              title="Enter Verification Code"
              subtitle={`We've sent a code to ${userEmail}`}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-6" onPaste={handlePaste}>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            className="w-full mb-4"
            disabled={isLoading || otp.join("").length !== 6}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </span>
            ) : (
              "Verify & Sign In"
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn&apos;t receive the code?
            </p>
            <button
              onClick={handleResendOtp}
              disabled={cooldown > 0}
              className={`text-sm font-medium ${cooldown > 0 ? "text-gray-400" : "text-primary-600 hover:text-primary-700"}`}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200 mt-4">
            <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-500">
              <Link href="/help" className="flex items-center gap-1 hover:text-primary-600">
                <HelpCircle className="w-3.5 h-3.5" />
                Help
              </Link>
            </div>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  // ======= SUCCESS STEP =======
  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome!</h2>
          <p className="text-gray-600">Signing you in...</p>
          <div className="mt-4 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
