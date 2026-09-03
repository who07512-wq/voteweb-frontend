"use client"

import { AdminLayout } from "@/components/admin-dashboard/AdminLayout"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { MOCK_ELECTION_RESULTS } from "@/lib/results-data"
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trophy,
  Medal,
  X,
  Eye,
  Send,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export default function AdminResultsPage() {
  const results = MOCK_ELECTION_RESULTS
  const [expandedPositions, setExpandedPositions] = useState<Record<string, boolean>>(
    Object.fromEntries(results.positions.map((p) => [p.position, true]))
  )
  const [resultStatus, setResultStatus] = useState<"ready" | "approved" | "published">(
    results.status === "published" ? "published" : "ready"
  )
  const [publishConfirmText, setPublishConfirmText] = useState("")

  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)

  const validationChecklist = [
    { label: "Voting period closed", checked: true },
    { label: "Ballot processing completed", checked: true },
    { label: "Candidate list finalized", checked: true },
    { label: "Vote totals calculated", checked: true },
    { label: "No unresolved election issues", checked: true },
    { label: "Results ready for publication", checked: true },
  ]

  const togglePosition = (position: string) => {
    setExpandedPositions((prev) => ({ ...prev, [position]: !prev[position] }))
  }

  const handleApprove = () => {
    setResultStatus("approved")
    setShowApproveModal(false)
  }

  const handlePublish = () => {
    if (publishConfirmText !== "PUBLISH") return
    setResultStatus("published")
    setShowPublishModal(false)
    setPublishConfirmText("")
  }

  const getStatusBadge = () => {
    switch (resultStatus) {
      case "ready":
        return <Badge variant="warning">Ready for Review</Badge>
      case "approved":
        return <Badge variant="info">Approved</Badge>
      case "published":
        return <Badge variant="success">Published</Badge>
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Election Results</h1>
            <p className="text-sm text-text-secondary mt-1">
              Review and publish official election results.
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Results Overview */}
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Results Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-primary-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-medium text-primary-600">Election Status</span>
              </div>
              <p className="text-lg font-bold text-primary-700">Voting Closed</p>
            </div>
            <div className="bg-primary-50 rounded-xl p-4">
              <span className="text-xs font-medium text-primary-600 block mb-1">Eligible Students</span>
              <p className="text-lg font-bold text-primary-700">{results.eligibleStudents.toLocaleString()}</p>
            </div>
            <div className="bg-primary-50 rounded-xl p-4">
              <span className="text-xs font-medium text-primary-600 block mb-1">Ballots Submitted</span>
              <p className="text-lg font-bold text-primary-700">{results.ballotsSubmitted.toLocaleString()}</p>
            </div>
            <div className="bg-success-50 rounded-xl p-4">
              <span className="text-xs font-medium text-success-600 block mb-1">Participation</span>
              <p className="text-lg font-bold text-success-600">{results.participation}%</p>
            </div>
            <div className="bg-primary-50 rounded-xl p-4 col-span-2 sm:col-span-1">
              <span className="text-xs font-medium text-primary-600 block mb-1">Positions / Candidates</span>
              <p className="text-lg font-bold text-primary-700">
                {results.totalPositions} / {results.totalCandidates}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-neutral-100 flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Results Status</span>
            {getStatusBadge()}
          </div>
        </Card>

        {/* Validation Checklist */}
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Validation Checklist</h2>
          <div className="space-y-3">
            {validationChecklist.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.checked
                      ? "bg-success-100 text-success-600"
                      : "bg-neutral-100 text-text-muted"
                  }`}
                >
                  {item.checked && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <span className="text-sm text-text-primary">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Result Review by Position */}
        <div className="space-y-4">
          {results.positions.map((position) => (
            <Card key={position.position}>
              <button
                onClick={() => togglePosition(position.position)}
                className="w-full flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-text-primary">{position.position}</h3>
                  {position.isTie && (
                    <Badge variant="warning" size="sm">Tie</Badge>
                  )}
                </div>
                {expandedPositions[position.position] ? (
                  <ChevronUp className="w-5 h-5 text-text-muted" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-text-muted" />
                )}
              </button>

              {expandedPositions[position.position] && (
                <div className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 font-medium text-text-secondary">Name</th>
                          <th className="text-right py-2 px-3 font-medium text-text-secondary">Votes</th>
                          <th className="text-right py-2 px-3 font-medium text-text-secondary">Percentage</th>
                          <th className="text-center py-2 px-3 font-medium text-text-secondary">Rank</th>
                        </tr>
                      </thead>
                      <tbody>
                        {position.candidates.map((candidate) => (
                          <tr
                            key={candidate.id}
                            className={`border-b border-border/50 ${
                              candidate.status === "winner" ? "bg-success-50/50" : ""
                            }`}
                          >
                            <td className="py-3 px-3 flex items-center gap-2">
                              {candidate.status === "winner" && (
                                <Trophy className="w-4 h-4 text-warning-500" />
                              )}
                              {candidate.status === "runner_up" && (
                                <Medal className="w-4 h-4 text-text-muted" />
                              )}
                              <span
                                className={`font-medium ${
                                  candidate.status === "winner"
                                    ? "text-success-700"
                                    : "text-text-primary"
                                }`}
                              >
                                {candidate.name}
                              </span>
                              {candidate.status === "winner" && (
                                <Badge variant="success" size="sm">Winner</Badge>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right text-text-primary font-medium">
                              {candidate.votes.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right text-text-secondary">
                              {candidate.percentage}%
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                                {candidate.rank}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {position.abstained > 0 && (
                    <div className="mt-3 px-3 py-2 rounded-xl bg-neutral-100 text-xs text-text-secondary">
                      Abstained: <span className="font-medium text-text-primary">{position.abstained}</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Result Status Section */}
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Result Status</h2>
          <div className="flex items-center gap-3">
            {resultStatus === "ready" && <AlertTriangle className="w-5 h-5 text-warning-500" />}
            {resultStatus === "approved" && <Shield className="w-5 h-5 text-primary-600" />}
            {resultStatus === "published" && <CheckCircle2 className="w-5 h-5 text-success-600" />}
            <span className="text-sm text-text-secondary">
              {resultStatus === "ready" && "Results are awaiting admin approval."}
              {resultStatus === "approved" && "Results have been approved. Ready to publish."}
              {resultStatus === "published" && "Results have been published to all students."}
            </span>
            {getStatusBadge()}
          </div>
        </Card>

        {/* Actions */}
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {resultStatus === "ready" && (
              <Button onClick={() => setShowApproveModal(true)}>
                <Shield className="w-4 h-4" />
                Approve Results
              </Button>
            )}
            {resultStatus === "approved" && (
              <Button onClick={() => setShowPublishModal(true)}>
                <Send className="w-4 h-4" />
                Publish Results
              </Button>
            )}
            {resultStatus === "published" && (
              <Link href="/student/results">
                <Button variant="secondary">
                  <Eye className="w-4 h-4" />
                  View Public Results
                </Button>
              </Link>
            )}
          </div>
        </Card>

        {/* Results Published State */}
        {resultStatus === "published" && (
          <Card className="border-success-200 bg-success-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-success-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-success-700">Results Published</h3>
                <p className="text-sm text-success-600 mt-1">
                  Published on {results.publishedDate} by {results.publishedBy}.
                </p>
                <div className="mt-3">
                  <Link href="/student/results">
                    <Button variant="secondary" size="sm">
                      <Eye className="w-4 h-4" />
                      View Public Results
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Approve Modal */}
        {showApproveModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowApproveModal(false)}
          >
            <div
              className="w-full max-w-md bg-white rounded-2xl shadow-[0_20px_40px_rgba(32,39,92,0.2)] border border-border overflow-hidden animate-slide-down"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-text-primary">Approve Election Results?</h2>
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="p-1.5 rounded-xl text-text-muted hover:bg-primary-50 hover:text-text-primary transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-5 py-5">
                <p className="text-sm text-text-secondary leading-relaxed">
                  Confirm that the displayed results have been reviewed by authorized election administration.
                </p>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowApproveModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleApprove}>
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Publish Modal */}
        {showPublishModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowPublishModal(false)}
          >
            <div
              className="w-full max-w-md bg-white rounded-2xl shadow-[0_20px_40px_rgba(32,39,92,0.2)] border border-border overflow-hidden animate-slide-down"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-text-primary">Publish Official Results?</h2>
                <button
                  onClick={() => {
                    setShowPublishModal(false)
                    setPublishConfirmText("")
                  }}
                  className="p-1.5 rounded-xl text-text-muted hover:bg-primary-50 hover:text-text-primary transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-5 py-5">
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  Once published, these results will become visible to eligible users.
                </p>
                <label className="text-xs font-medium text-text-secondary block mb-1.5">
                  Type <span className="font-bold text-text-primary">PUBLISH</span> to confirm
                </label>
                <input
                  type="text"
                  value={publishConfirmText}
                  onChange={(e) => setPublishConfirmText(e.target.value)}
                  placeholder="PUBLISH"
                  className="w-full px-4 py-2.5 text-sm bg-white border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-150"
                />
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPublishModal(false)
                      setPublishConfirmText("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={publishConfirmText !== "PUBLISH"}
                    onClick={handlePublish}
                  >
                    <Send className="w-4 h-4" />
                    Publish Results
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
