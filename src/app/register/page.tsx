"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://vote-main-production.up.railway.app/api/v1";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    fullName: "",
    mobileNumber: "",
    enrollmentNumber: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!formData.email || !formData.username || !formData.fullName || !formData.enrollmentNumber) {
      setError("All fields are required");
      return;
    }

    setIsLoading(true);

    try {
      // Get CSRF token
      const csrfRes = await fetch(`${API_BASE}/auth/csrf`, {
        credentials: "include",
      });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.data?.csrfToken || "";

      // Register account
      const res = await fetch(`${API_BASE}/auth/register/instant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          fullName: formData.fullName,
          mobileNumber: formData.mobileNumber.replace(/\D/g, "").slice(-10),
          enrollmentNumber: formData.enrollmentNumber,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <AuthCard>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Created!</h2>
            <p className="text-gray-600 mb-4">Your account has been created successfully.</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-6 h-6 text-primary-600" />
            </div>
            <AuthHeader
              title="Create Account"
              subtitle="Register for the Student Council Election 2026"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="your.email@example.com"
              required
            />

            <Input
              label="Username"
              type="text"
              value={formData.username}
              onChange={(e) => handleChange("username", e.target.value)}
              placeholder="Choose a username"
              required
            />

            <Input
              label="Full Name"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              placeholder="Your full name"
              required
            />

            <Input
              label="Mobile Number"
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => handleChange("mobileNumber", e.target.value)}
              placeholder="+91 XXXXXXXXXX"
            />

            <Input
              label="Enrollment Number"
              type="text"
              value={formData.enrollmentNumber}
              onChange={(e) => handleChange("enrollmentNumber", e.target.value)}
              placeholder="Your enrollment number"
              required
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Min 8 characters"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              placeholder="Re-enter password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
