"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_ELECTION_RESULTS } from "@/lib/results-data";
import {
  CheckCircle2,
  Trophy,
  Medal,
  Users,
  BarChart3,
  Search,
  ChevronDown,
  ChevronUp,
  Copy,
  Printer,
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Shield,
  Info,
} from "lucide-react";

export default function StudentResultsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);

  const results = MOCK_ELECTION_RESULTS;
  const isPublished = results.status === "published";

  const filteredPositions = results.positions.filter((position) => {
    const matchesSearch =
      position.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.candidates.some((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesFilter =
      positionFilter === "all" || position.position === positionFilter;
    return matchesSearch && matchesFilter;
  });

  if (!isPublished) {
    return (
      <StudentLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md w-full text-center p-8 border-border">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-primary-300" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              Results Not Published Yet
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Official election results will appear here after they are
              published by Election Administration.
            </p>
            <Button
              variant="primary"
              onClick={() => (window.location.href = "/student/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </Button>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Election Results
            </h1>
            <p className="text-sm text-text-secondary">
              Official results for the Student Council Election 2026.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success">Official Results</Badge>
            <Badge variant="warning">Demo Results</Badge>
          </div>
        </div>

        {/* Status Card */}
        <Card className="p-5 border-success/20 bg-success-50">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Official Results
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Results published by Election Administration.
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-text-secondary">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Published: {results.publishedDate}
                </span>
                <span className="text-xs text-text-secondary">
                  {results.electionName}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <Card className="p-5 border-border">
          <h3 className="text-sm font-bold text-text-primary mb-4">
            Election Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Positions Contested", value: results.totalPositions },
              { label: "Candidates", value: results.totalCandidates },
              { label: "Eligible Students", value: results.eligibleStudents.toLocaleString() },
              { label: "Ballots Submitted", value: results.ballotsSubmitted.toLocaleString() },
              { label: "Participation", value: `${results.participation}%` },
              { label: "Status", value: "Official Results", isBadge: true },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-primary-50/50">
                <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">
                  {item.label}
                </p>
                {item.isBadge ? (
                  <Badge variant="success" className="text-xs">{item.value}</Badge>
                ) : (
                  <p className="text-lg font-bold text-text-primary">{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Participation */}
        <Card className="p-5 border-border">
          <h3 className="text-sm font-bold text-text-primary mb-4">
            Voter Participation
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">
                {results.eligibleStudents.toLocaleString()}
              </p>
              <p className="text-xs text-text-secondary">Eligible Students</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {results.ballotsSubmitted.toLocaleString()}
              </p>
              <p className="text-xs text-text-secondary">Ballots Submitted</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {results.participation}%
              </p>
              <p className="text-xs text-text-secondary">Participation Rate</p>
            </div>
          </div>
          <div className="w-full bg-border rounded-full h-3">
            <div
              className="bg-primary-600 h-3 rounded-full transition-all"
              style={{ width: `${results.participation}%` }}
            />
          </div>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search candidates or positions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-border text-sm text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Positions</option>
            {results.positions.map((p) => (
              <option key={p.position} value={p.position}>
                {p.position}
              </option>
            ))}
          </select>
        </div>

        {/* Position Results */}
        {filteredPositions.map((position) => {
          const winner = position.candidates.find((c) => c.status === "winner");
          const runnerUp = position.candidates.find((c) => c.status === "runner_up");
          const isExpanded = expandedPosition === position.position;

          return (
            <Card key={position.position} className="border-border overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-text-primary">
                    {position.position}
                  </h3>
                  <div className="flex items-center gap-2">
                    {position.isTie && (
                      <Badge variant="warning" className="text-[10px]">Tie Result</Badge>
                    )}
                    <Badge variant="info" className="text-[10px]">
                      {position.totalVotes.toLocaleString()} votes
                    </Badge>
                  </div>
                </div>

                {position.isTie && (
                  <div className="p-3 rounded-xl bg-warning-50 border border-warning/20 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-warning">
                          Tie Result
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          Two candidates received the same number of votes.
                          Election Administration review required.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Winner */}
                {winner && (
                  <div className="p-4 rounded-xl bg-primary-50 border border-primary-100 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center font-bold text-white text-sm">
                        {winner.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-primary-600" />
                          <span className="text-sm font-bold text-text-primary">
                            {winner.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-text-secondary">
                            {winner.votes.toLocaleString()} votes
                          </span>
                          <span className="text-xs font-medium text-primary-600">
                            {winner.percentage}%
                          </span>
                        </div>
                      </div>
                      <Badge variant="success" className="text-[10px]">Winner</Badge>
                    </div>
                  </div>
                )}

                {/* Runner-up */}
                {runnerUp && (
                  <div className="p-3 rounded-xl bg-primary-50/30 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center font-bold text-primary-600 text-xs">
                        {runnerUp.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Medal className="w-3.5 h-3.5 text-primary-400" />
                          <span className="text-sm font-medium text-text-primary">
                            {runnerUp.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-text-secondary">
                            {runnerUp.votes.toLocaleString()} votes
                          </span>
                          <span className="text-xs text-primary-600">
                            {runnerUp.percentage}%
                          </span>
                        </div>
                      </div>
                      <Badge variant="neutral" className="text-[10px]">Runner-up</Badge>
                    </div>
                  </div>
                )}

                {/* Abstained */}
                {position.abstained > 0 && (
                  <p className="text-xs text-text-secondary mb-3">
                    Abstained: {position.abstained} — Abstention represents ballots
                    where no candidate was selected for this position.
                  </p>
                )}

                {/* Expand toggle */}
                <button
                  onClick={() =>
                    setExpandedPosition(
                      isExpanded ? null : position.position
                    )
                  }
                  className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      Hide Result Breakdown
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      View Result Breakdown
                    </>
                  )}
                </button>

                {/* Expanded breakdown */}
                {isExpanded && (
                  <div className="mt-4 border-t border-border pt-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 font-medium text-text-secondary">
                            Candidate
                          </th>
                          <th className="text-right py-2 font-medium text-text-secondary">
                            Votes
                          </th>
                          <th className="text-right py-2 font-medium text-text-secondary">
                            Percentage
                          </th>
                          <th className="text-right py-2 font-medium text-text-secondary">
                            Rank
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {position.candidates
                          .sort((a, b) => a.rank - b.rank)
                          .map((c) => (
                            <tr key={c.id} className="border-b border-border/50">
                              <td className="py-2.5 flex items-center gap-2">
                                {c.status === "winner" && (
                                  <Trophy className="w-3.5 h-3.5 text-primary-600" />
                                )}
                                <span className="text-text-primary font-medium">
                                  {c.name}
                                </span>
                              </td>
                              <td className="py-2.5 text-right text-text-secondary">
                                {c.votes.toLocaleString()}
                              </td>
                              <td className="py-2.5 text-right text-text-secondary">
                                {c.percentage}%
                              </td>
                              <td className="py-2.5 text-right">
                                <Badge
                                  variant={
                                    c.rank === 1
                                      ? "success"
                                      : c.rank === 2
                                      ? "info"
                                      : "neutral"
                                  }
                                  className="text-[10px]"
                                >
                                  {c.rank === 1
                                    ? "1st"
                                    : c.rank === 2
                                    ? "2nd"
                                    : `${c.rank}th`}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {/* Verification */}
        <Card className="p-5 border-border">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-text-primary mb-2">
                Results Verification
              </h3>
              <div className="space-y-1.5">
                {[
                  { label: "Election", value: results.electionName },
                  { label: "Status", value: "Official" },
                  { label: "Published By", value: results.publishedBy },
                  { label: "Published Date", value: results.publishedDate },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-xs">
                    <span className="text-text-secondary">{item.label}</span>
                    <span className="font-medium text-text-primary">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-text-secondary mt-3 flex items-center gap-1">
                <Info className="w-3 h-3" />
                These results represent the official results published by
                Election Administration.
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast("Link copied to clipboard", "success");
            }}
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Results Link
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={() => window.print()}
          >
            <Printer className="w-3.5 h-3.5" />
            Print Results
          </Button>
        </div>
      </div>
    </StudentLayout>
  );
}
