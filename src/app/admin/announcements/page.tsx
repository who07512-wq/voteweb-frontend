"use client";

import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { adminApi, type AdminAnnouncementRecord } from "@/lib/api/admin";
import { Plus, Megaphone, Edit, Trash2, Eye, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

const AUDIENCE_OPTIONS = ["all", "students", "candidates", "admins"];

const STATUS_VARIANT: Record<string, "neutral" | "info" | "success"> = {
  Draft: "neutral",
  Scheduled: "info",
  Published: "success",
  Archived: "neutral",
};

function statusOf(a: AdminAnnouncementRecord): string {
  return a.status || (a.status === undefined ? "Published" : "Draft");
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AdminAnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewing, setViewing] = useState<AdminAnnouncementRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [priority, setPriority] = useState("normal");
  const [publishNow, setPublishNow] = useState(false);

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setAudience("all");
    setPriority("normal");
    setPublishNow(false);
    setEditingId(null);
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getAnnouncements();
      const rows: AdminAnnouncementRecord[] = Array.isArray(res)
        ? res
        : ((res as { announcements?: AdminAnnouncementRecord[] }).announcements as AdminAnnouncementRecord[]) ||
          ((res as unknown as AdminAnnouncementRecord[]) ?? []);
      setAnnouncements(rows || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load announcements. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    resetForm();
    setActionError("");
    setShowFormModal(true);
  };

  const openEdit = (a: AdminAnnouncementRecord) => {
    setActionError("");
    setTitle(a.title || "");
    setMessage(a.content || "");
    setAudience((a as unknown as { audience?: string }).audience || "all");
    setPriority((a as unknown as { priority?: string }).priority || "normal");
    setPublishNow(statusOf(a) === "Published");
    setEditingId(a.id);
    setShowFormModal(true);
  };

  const openView = (a: AdminAnnouncementRecord) => {
    setViewing(a);
    setShowViewModal(true);
  };

  const handleSave = async (publish: boolean) => {
    if (!title.trim() || !message.trim()) {
      setActionError("Title and message are required.");
      return;
    }
    setSaving(true);
    setActionError("");
    try {
      const body = {
        title: title.trim(),
        message: message.trim(),
        audience,
        priority,
        is_published: publish || publishNow,
      };
      if (editingId) {
        await adminApi.updateAnnouncement(editingId, body);
      } else {
        await adminApi.createAnnouncement(body);
      }
      setShowFormModal(false);
      setShowPublishModal(false);
      resetForm();
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Save failed. Please try again.");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    setActionError("");
    try {
      await adminApi.deleteAnnouncement(id);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Delete failed. Please try again.");
    }
  };

  const fmtDate = (d: string | undefined) =>
    d ? new Date(d).toLocaleString() : "—";

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Announcements</h1>
            <p className="text-text-secondary mt-1">Create and manage election announcements.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Create Announcement
          </Button>
        </div>

        {actionError && (
          <Card className="p-4 flex items-center gap-3 border-error-200 bg-error-50">
            <AlertTriangle className="w-5 h-5 text-error-500" />
            <p className="text-sm text-error-600">{actionError}</p>
          </Card>
        )}

        {loading ? (
          <Card className="p-12 text-center text-text-secondary">Loading announcements…</Card>
        ) : error ? (
          <Card className="p-12 text-center">
            <AlertTriangle className="h-10 w-10 text-error-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text-primary">{error}</h3>
            <Button onClick={load} className="mt-4" variant="outline">
              Retry
            </Button>
          </Card>
        ) : announcements.length === 0 ? (
          <Card className="p-12 text-center">
            <Megaphone className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary">No Announcements</h3>
            <p className="text-text-secondary mt-1">
              Create your first announcement to reach students.
            </p>
            <Button onClick={openCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              Create Announcement
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {announcements.map((announcement) => {
              const st = statusOf(announcement);
              return (
                <Card key={announcement.id} className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-text-primary">{announcement.title}</h3>
                        <Badge variant={STATUS_VARIANT[st] || "neutral"}>{st}</Badge>
                        {(announcement as unknown as { priority?: string }).priority === "high" && (
                          <Badge variant="warning" size="sm">High priority</Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary line-clamp-2">{announcement.content}</p>
                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        <span>
                          Audience:{" "}
                          <Badge variant="default" size="sm">
                            {(announcement as unknown as { audience?: string }).audience || "all"}
                          </Badge>
                        </span>
                        <span>Created: {fmtDate(announcement.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEdit(announcement)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openView(announcement)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error-500 hover:text-error-600 hover:bg-error-50"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Form Modal */}
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => {
                setShowFormModal(false);
                resetForm();
              }}
            />
            <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">
                  {editingId ? "Edit Announcement" : "Create Announcement"}
                </h3>
                <button
                  onClick={() => {
                    setShowFormModal(false);
                    resetForm();
                  }}
                  className="p-1 hover:bg-bg-tertiary rounded-lg"
                >
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Announcement title"
                    maxLength={200}
                    className="w-full border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your announcement message..."
                    rows={4}
                    className="w-full border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Audience</label>
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="w-full border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {AUDIENCE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={publishNow}
                    onChange={(e) => setPublishNow(e.target.checked)}
                    className="rounded border-border"
                  />
                  Publish immediately (visible to the selected audience)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFormModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button variant="secondary" disabled={saving} onClick={() => handleSave(false)}>
                  {saving ? "Saving…" : publishNow ? "Save & Publish" : "Save Draft"}
                </Button>
                {!publishNow && (
                  <Button disabled={saving} onClick={() => setShowPublishModal(true)}>
                    Publish
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Publish Confirm Modal */}
        {showPublishModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowPublishModal(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">Publish Announcement?</h3>
                  <p className="text-sm text-text-secondary">
                    This announcement will become visible to the selected audience.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowPublishModal(false)}>
                  Cancel
                </Button>
                <Button disabled={saving} onClick={() => handleSave(true)}>
                  {saving ? "Publishing…" : "Publish"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && viewing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => {
                setShowViewModal(false);
                setViewing(null);
              }}
            />
            <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">Announcement Details</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewing(null);
                  }}
                  className="p-1 hover:bg-bg-tertiary rounded-lg"
                >
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-muted">Title</label>
                  <p className="text-sm font-semibold text-text-primary">{viewing.title}</p>
                </div>
                <div>
                  <label className="text-xs text-text-muted">Message</label>
                  <p className="text-sm text-text-primary leading-relaxed bg-bg-tertiary rounded-lg p-4 mt-1">
                    {viewing.content}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted">Audience</label>
                    <p className="text-sm text-text-primary mt-1">
                      <Badge variant="default">
                        {(viewing as unknown as { audience?: string }).audience || "all"}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted">Created</label>
                    <p className="text-sm text-text-primary mt-1">{fmtDate(viewing.created_at)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted">Status</label>
                  <p className="mt-1">
                    <Badge variant={STATUS_VARIANT[statusOf(viewing)] || "neutral"}>
                      {statusOf(viewing)}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowViewModal(false);
                    setViewing(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
