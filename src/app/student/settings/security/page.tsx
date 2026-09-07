"use client";

import React from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_ACTIVE_SESSIONS } from "@/lib/student-profile-data";
import {
  ArrowLeft,
  Shield,
  Monitor,
  Smartphone,
  LogOut,
  Mail,
} from "lucide-react";

export default function SecurityPage() {
  return (
    <StudentLayout>
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <Link href="/student/settings">
                <Button variant="ghost" size="sm" className="gap-1.5 mb-3">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Settings
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-text-primary">Security Settings</h1>
              <p className="text-sm text-text-secondary">
                Manage your sign-in method and active sessions.
              </p>
            </div>

            {/* Sign-in method */}
            <Card className="p-5 border-border">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary-400" />
                Sign-in Method
              </h2>
              <div className="p-3 rounded-xl bg-primary-50/50 border border-primary-100 text-sm text-primary-800">
                <p className="font-medium">One-time code by email</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Your account has no password. Each time you sign in, a fresh one-time code is
                  sent to your registered email.
                </p>
              </div>
            </Card>

            {/* Two-Factor Authentication */}
            <Card className="p-5 border-border">
              <h2 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-400" />
                Two-Factor Authentication
              </h2>
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary-50/50 mb-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">Status</p>
                  <p className="text-xs text-text-secondary">Add an extra security step when signing in.</p>
                </div>
                <Badge variant="warning" className="text-[10px]">Not Enabled</Badge>
              </div>
              <Button variant="secondary" size="sm" className="gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Enable 2FA
              </Button>
            </Card>

            {/* Active Sessions */}
            <Card className="p-5 border-border">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary-400" />
                Active Sessions
              </h2>
              <div className="space-y-3">
                {MOCK_ACTIVE_SESSIONS.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      session.isCurrent ? "bg-success-50 border border-success/20" : "bg-primary-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {session.device.includes("Mobile") ? (
                        <Smartphone className="w-5 h-5 text-text-secondary" />
                      ) : (
                        <Monitor className="w-5 h-5 text-text-secondary" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text-primary">{session.device}</p>
                          {session.isCurrent && (
                            <Badge variant="success" className="text-[10px]">Current</Badge>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary">
                          {session.location} &bull; {session.lastActive}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="ghost" size="sm" className="gap-1.5 text-error">
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out Other Sessions
                </Button>
              </div>
            </Card>
          </div>
    </StudentLayout>
  );
}
