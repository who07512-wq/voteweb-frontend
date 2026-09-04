"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { adminApi } from "@/lib/api/admin";
import { BarChart3, Inbox, AlertTriangle } from "lucide-react";

interface ResultsFull {
  election_id: number;
  election_name: string;
  election_status: string;
  eligible_students: number;
  ballots_submitted: number;
  participation_rate: number;
  results_published: boolean;
  clubs: Array<{
    club_id: number;
    club_name: string;
    positions: Array<{
      position_id: number;
      position_name: string;
      candidates: Array<{
        candidate_id: number;
        candidate_name: string;
        vote_count: number;
        percentage: number;
        rank: number;
        status: string;
      }>;
      total_votes: number;
    }>;
  }>;
}

export default function AdminResultsPage() {
  const [elections, setElections] = useState<Array<{ id: number; name: string; status: string }>>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [results, setResults] = useState<ResultsFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResults = async (id: number) => {
    try {
      const res = await adminApi.getElectionResults(id);
      setResults(res as ResultsFull);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load data. Please try again.");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await adminApi.getMonitorElections();
        const list = res.elections || [];
        setElections(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
          await loadResults(list[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load data. Please try again.");
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Results</h1>
        <p className="text-sm text-text-secondary mt-1">Real vote counts from the database.</p>
      </div>

      {elections.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16">
            <Inbox className="h-12 w-12 text-text-tertiary mb-3" />
            <p className="text-text-secondary font-medium">No elections are currently available.</p>
            <p className="text-sm text-text-tertiary mt-1">Create an election to see results here.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {elections.map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  setSelectedId(e.id);
                  setResults(null);
                  loadResults(e.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition ${
                  selectedId === e.id
                    ? "bg-primary-50 border-primary-300 text-primary-700"
                    : "border-border text-text-secondary hover:bg-primary-50"
                }`}
              >
                {e.name}
              </button>
            ))}
          </div>

          {error && !results ? (
            <div className="p-8 text-center">
              <AlertTriangle className="w-10 h-10 text-error-500 mx-auto mb-3" />
              <p className="text-text-primary font-medium">Unable to load results</p>
              <p className="text-sm text-text-secondary">{error}</p>
            </div>
          ) : !results ? (
            <div className="p-8 text-center text-text-secondary">Loading results...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                  <p className="text-2xl font-bold text-text-primary">{results.ballots_submitted}</p>
                  <p className="text-xs text-text-tertiary">Ballots submitted</p>
                </Card>
                <Card className="p-4">
                  <p className="text-2xl font-bold text-text-primary">{results.eligible_students}</p>
                  <p className="text-xs text-text-tertiary">Eligible voters</p>
                </Card>
                <Card className="p-4">
                  <p className="text-2xl font-bold text-primary-600">{results.participation_rate}%</p>
                  <p className="text-xs text-text-tertiary">Participation</p>
                </Card>
                <Card className="p-4">
                  <Badge variant={results.results_published ? "success" : "warning"}>
                    {results.results_published ? "Published" : "Not published"}
                  </Badge>
                  <p className="text-xs text-text-tertiary mt-1">Results status</p>
                </Card>
              </div>

              {results.clubs.length === 0 ? (
                <Card>
                  <div className="flex flex-col items-center justify-center py-12">
                    <Inbox className="h-10 w-10 text-text-tertiary mb-3" />
                    <p className="text-text-secondary font-medium">No votes have been cast yet.</p>
                  </div>
                </Card>
              ) : (
                results.clubs.map((club) => (
                  <Card key={club.club_id} className="p-6">
                    <h2 className="font-semibold text-text-primary mb-4">{club.club_name}</h2>
                    <div className="space-y-5">
                      {club.positions.map((pos) => (
                        <div key={pos.position_id}>
                          <p className="text-sm font-medium text-text-secondary mb-2">{pos.position_name}</p>
                          <div className="space-y-2">
                            {pos.candidates.map((c) => (
                              <div key={c.candidate_id} className="flex items-center gap-3">
                                <span className="text-sm text-text-primary w-40 truncate">{c.candidate_name}</span>
                                <div className="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${c.status === "winner" ? "bg-success-500" : "bg-primary-500"}`}
                                    style={{ width: `${Math.max(c.percentage, 1)}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-text-primary w-10 text-right">{c.vote_count}</span>
                                <span className="text-xs text-text-tertiary w-12 text-right">{Math.round(c.percentage)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
