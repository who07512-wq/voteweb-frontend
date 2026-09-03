"use client";

import React, { useState, useMemo } from "react";
import { Search, Eye, X, Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { MOCK_ADMIN_STUDENTS, type AdminStudent } from "@/lib/admin-dashboard-data";

const DEPARTMENTS = ["All", "BCA", "BBA", "BSc IT"] as const;
const YEARS = ["All", "1st Year", "2nd Year", "3rd Year"] as const;
const ELIGIBILITIES = ["All", "Eligible", "Not Eligible", "Suspended", "Pending Verification"] as const;
const VOTING_STATUSES = ["All", "Not Voted", "Voted"] as const;

function getEligibilityBadgeVariant(eligibility: AdminStudent["eligibility"]) {
  switch (eligibility) {
    case "Eligible":
      return "success";
    case "Not Eligible":
      return "error";
    case "Suspended":
      return "warning";
    case "Pending Verification":
      return "info";
  }
}

function getVotingBadgeVariant(status: AdminStudent["votingStatus"]) {
  return status === "Voted" ? "success" : "neutral";
}

function getAccountBadgeVariant(status: AdminStudent["accountStatus"]) {
  switch (status) {
    case "Active":
      return "success";
    case "Suspended":
      return "error";
    case "Pending":
      return "warning";
  }
}

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>("All");
  const [year, setYear] = useState<string>("All");
  const [eligibility, setEligibility] = useState<string>("All");
  const [votingStatus, setVotingStatus] = useState<string>("All");
  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null);

  const filteredStudents = useMemo(() => {
    return MOCK_ADMIN_STUDENTS.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.id.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (department !== "All" && s.department !== department) return false;
      if (year !== "All" && s.year !== year) return false;
      if (eligibility !== "All" && s.eligibility !== eligibility) return false;
      if (votingStatus !== "All" && s.votingStatus !== votingStatus) return false;
      return true;
    });
  }, [search, department, year, eligibility, votingStatus]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Student Management</h1>
          <p className="text-sm font-semibold text-text-secondary">View and manage student accounts.</p>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>

            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-3 py-2.5 text-sm bg-white border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d === "All" ? "All Departments" : d}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2.5 text-sm bg-white border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y === "All" ? "All Years" : y}
                </option>
              ))}
            </select>

            <select
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              className="px-3 py-2.5 text-sm bg-white border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer"
            >
              {ELIGIBILITIES.map((el) => (
                <option key={el} value={el}>
                  {el === "All" ? "All Eligibility" : el}
                </option>
              ))}
            </select>

            <select
              value={votingStatus}
              onChange={(e) => setVotingStatus(e.target.value)}
              className="px-3 py-2.5 text-sm bg-white border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer"
            >
              {VOTING_STATUSES.map((vs) => (
                <option key={vs} value={vs}>
                  {vs === "All" ? "All Voting Status" : vs}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {filteredStudents.length === 0 ? (
          <EmptyState
            title="No Students Found"
            description="No students match your current filters. Try adjusting the search criteria."
            icon={<Search className="w-8 h-8 text-text-muted" />}
          />
        ) : (
          <>
            <Card className="hidden md:block overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 font-semibold text-text-secondary">Student ID</th>
                      <th className="text-left px-4 py-3 font-semibold text-text-secondary">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-text-secondary">Department</th>
                      <th className="text-left px-4 py-3 font-semibold text-text-secondary">Year</th>
                      <th className="text-left px-4 py-3 font-semibold text-text-secondary">Eligibility</th>
                      <th className="text-left px-4 py-3 font-semibold text-text-secondary">Voting Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-text-secondary">Account Status</th>
                      <th className="text-right px-4 py-3 font-semibold text-text-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b border-border last:border-0 hover:bg-bg-tertiary/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-text-secondary">{student.id}</td>
                        <td className="px-4 py-3 font-medium text-text-primary">{student.name}</td>
                        <td className="px-4 py-3 text-text-secondary">{student.department}</td>
                        <td className="px-4 py-3 text-text-secondary">{student.year}</td>
                        <td className="px-4 py-3">
                          <Badge variant={getEligibilityBadgeVariant(student.eligibility)} size="sm">
                            {student.eligibility}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getVotingBadgeVariant(student.votingStatus)} size="sm">
                            {student.votingStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getAccountBadgeVariant(student.accountStatus)} size="sm">
                            {student.accountStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedStudent(student)}
                            className="gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="md:hidden space-y-3">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-xs text-text-muted mb-0.5">{student.id}</p>
                      <p className="font-semibold text-text-primary">{student.name}</p>
                      <p className="text-sm text-text-secondary">{student.department} &middot; {student.year}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStudent(student)}
                      className="gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={getEligibilityBadgeVariant(student.eligibility)} size="sm">
                      {student.eligibility}
                    </Badge>
                    <Badge variant={getVotingBadgeVariant(student.votingStatus)} size="sm">
                      {student.votingStatus}
                    </Badge>
                    <Badge variant={getAccountBadgeVariant(student.accountStatus)} size="sm">
                      {student.accountStatus}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-text-secondary">
              <p>Showing <span className="font-semibold text-text-primary">{filteredStudents.length}</span> of <span className="font-semibold text-text-primary">{MOCK_ADMIN_STUDENTS.length}</span> students</p>
            </div>
          </>
        )}

        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title="Student Details"
        >
          {selectedStudent && (
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="font-mono text-xs text-text-muted">{selectedStudent.id}</p>
                <p className="text-lg font-bold text-text-primary">{selectedStudent.name}</p>
                <p className="text-sm text-text-secondary">{selectedStudent.department} &middot; {selectedStudent.year}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-text-secondary">Account Status</span>
                  <Badge variant={getAccountBadgeVariant(selectedStudent.accountStatus)} size="sm">
                    {selectedStudent.accountStatus}
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-text-secondary">Election Eligibility</span>
                  <Badge variant={getEligibilityBadgeVariant(selectedStudent.eligibility)} size="sm">
                    {selectedStudent.eligibility}
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-text-secondary">Voting Status</span>
                  <Badge variant={getVotingBadgeVariant(selectedStudent.votingStatus)} size="sm">
                    {selectedStudent.votingStatus}
                  </Badge>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-primary-50 border border-primary-100">
                <Shield className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-primary-700 leading-relaxed">
                  Admin can view eligibility. Changes require confirmation.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="secondary" onClick={() => setSelectedStudent(null)} className="gap-1.5">
                  <X className="w-4 h-4" />
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
