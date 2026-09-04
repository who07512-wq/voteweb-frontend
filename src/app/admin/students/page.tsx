"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { adminApi, AdminStudentRecord } from "@/lib/api/admin";
import { Users, Inbox, AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<AdminStudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getStudents();
      const list = Array.isArray(res) ? res : res.students || [];
      setStudents(list);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load data. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Students</h1>
          <p className="text-sm text-text-secondary mt-1">All registered students from the database.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-error-50 border border-error-200 rounded-xl text-error-600 text-sm">
          {error}
        </div>
      )}

      {!loading && students.length === 0 && !error ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16">
            <Inbox className="h-12 w-12 text-text-tertiary mb-3" />
            <p className="text-text-secondary font-medium">No students have registered yet.</p>
            <p className="text-sm text-text-tertiary mt-1">
              Students appear here after their first Google sign-in or access-request approval.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="hidden md:block">
          {students.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-semibold text-text-primary py-3 px-4">Name</th>
                    <th className="text-left font-semibold text-text-primary py-3 px-4">Student ID</th>
                    <th className="text-left font-semibold text-text-primary py-3 px-4">Email</th>
                    <th className="text-left font-semibold text-text-primary py-3 px-4">Role</th>
                    <th className="text-left font-semibold text-text-primary py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-b-0 hover:bg-primary-50/40">
                      <td className="py-3 px-4 font-medium text-text-primary">{s.name}</td>
                      <td className="py-3 px-4 text-text-secondary font-mono text-xs">{s.student_id || "—"}</td>
                      <td className="py-3 px-4 text-text-secondary">{s.email || "—"}</td>
                      <td className="py-3 px-4"><Badge variant="info">{s.role}</Badge></td>
                      <td className="py-3 px-4">
                        <Badge variant={s.is_active ? "success" : "error"}>{s.is_active ? "Active" : "Inactive"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
