"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { adminApi, AdminAnnouncementRecord } from "@/lib/api/admin";
import { Megaphone, Inbox, AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<AdminAnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAnnouncements();
      const list = Array.isArray(res) ? res : res.announcements || [];
      setItems(list);
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
          <h1 className="text-2xl font-bold text-text-primary">Announcements</h1>
          <p className="text-sm text-text-secondary mt-1">All announcements from the database.</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-xl hover:bg-primary-50 transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-error-50 border border-error-200 rounded-xl text-error-600 text-sm">
          {error}
        </div>
      )}

      {!loading && items.length === 0 && !error ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16">
            <Inbox className="h-12 w-12 text-text-tertiary mb-3" />
            <p className="text-text-secondary font-medium">No announcements yet.</p>
            <p className="text-sm text-text-tertiary mt-1">Create announcements to notify voters.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-text-primary">{a.title}</p>
                  <p className="text-sm text-text-secondary mt-1 line-clamp-2">{a.content}</p>
                </div>
                <Badge variant={a.status === "published" ? "success" : "warning"}>{a.status || "draft"}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
