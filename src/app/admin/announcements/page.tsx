"use client"

import { AdminLayout } from "@/components/admin-dashboard/AdminLayout"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { MOCK_ANNOUNCEMENTS, type Announcement } from "@/lib/admin-dashboard-data"
import { Plus, Megaphone, Edit, Trash2, Eye, X, CheckCircle2 } from "lucide-react"
import { useState } from "react"

const AUDIENCE_OPTIONS = ["All Students", "Candidates", "Election Administrators"]

const STATUS_VARIANT: Record<string, "neutral" | "info" | "success"> = {
  Draft: "neutral",
  Scheduled: "info",
  Published: "success",
  Archived: "neutral",
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null)

  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [audience, setAudience] = useState("All Students")
  const [publishDate, setPublishDate] = useState("")
  const [status, setStatus] = useState<"Draft" | "Scheduled">("Draft")

  const resetForm = () => {
    setTitle("")
    setMessage("")
    setAudience("All Students")
    setPublishDate("")
    setStatus("Draft")
    setEditingId(null)
  }

  const openCreate = () => {
    resetForm()
    setShowFormModal(true)
  }

  const openEdit = (announcement: Announcement) => {
    setTitle(announcement.title)
    setMessage(announcement.message)
    setAudience(announcement.audience)
    setPublishDate(announcement.publishDate)
    setStatus(announcement.status === "Archived" ? "Draft" : announcement.status as "Draft" | "Scheduled")
    setEditingId(announcement.id)
    setShowFormModal(true)
  }

  const openView = (announcement: Announcement) => {
    setViewingAnnouncement(announcement)
    setShowViewModal(true)
  }

  const handleSaveDraft = () => {
    if (!title.trim() || !message.trim()) return

    if (editingId) {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? { ...a, title, message, audience, publishDate: publishDate || a.publishDate, status: "Draft" as const }
            : a
        )
      )
    } else {
      const newAnnouncement: Announcement = {
        id: `a-${Date.now()}`,
        title,
        message,
        audience,
        publishDate: publishDate || "Not set",
        status: "Draft",
      }
      setAnnouncements((prev) => [newAnnouncement, ...prev])
    }
    setShowFormModal(false)
    resetForm()
  }

  const openPublishConfirm = () => {
    setShowFormModal(false)
    setShowPublishModal(true)
  }

  const handlePublish = () => {
    if (!title.trim() || !message.trim()) return

    if (editingId) {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? { ...a, title, message, audience, publishDate: publishDate || a.publishDate, status: "Published" as const }
            : a
        )
      )
    } else {
      const newAnnouncement: Announcement = {
        id: `a-${Date.now()}`,
        title,
        message,
        audience,
        publishDate: publishDate || "Not set",
        status: "Published",
      }
      setAnnouncements((prev) => [newAnnouncement, ...prev])
    }
    setShowPublishModal(false)
    resetForm()
  }

  const handleDelete = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Announcements</h1>
            <p className="text-text-secondary mt-1">Create and manage election announcements.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Create Announcement
          </Button>
        </div>

        {announcements.length === 0 ? (
          <Card className="p-12 text-center">
            <Megaphone className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary">No Announcements</h3>
            <p className="text-text-secondary mt-1">Create your first announcement to get started.</p>
            <Button onClick={openCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              Create Announcement
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-text-primary">{announcement.title}</h3>
                      <Badge variant={STATUS_VARIANT[announcement.status]}>
                        {announcement.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-2">{announcement.message}</p>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span>Target: <Badge variant="default" size="sm">{announcement.audience}</Badge></span>
                      <span>Published: {announcement.publishDate}</span>
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
                    <Button variant="ghost" size="sm" className="text-error-500 hover:text-error-600 hover:bg-error-50" onClick={() => handleDelete(announcement.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => { setShowFormModal(false); resetForm() }} />
            <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">
                  {editingId ? "Edit Announcement" : "Create Announcement"}
                </h3>
                <button onClick={() => { setShowFormModal(false); resetForm() }} className="p-1 hover:bg-bg-tertiary rounded-lg">
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

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Audience</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Publish Date</label>
                    <input
                      type="date"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      className="w-full border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as "Draft" | "Scheduled")}
                      className="w-full border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Scheduled">Scheduled</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => { setShowFormModal(false); resetForm() }}>
                  Cancel
                </Button>
                <Button variant="secondary" onClick={handleSaveDraft}>
                  Save Draft
                </Button>
                <Button onClick={openPublishConfirm}>
                  Publish
                </Button>
              </div>
            </div>
          </div>
        )}

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
                  <p className="text-sm text-text-secondary">This announcement will become visible to the selected audience.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowPublishModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePublish}>
                  Publish
                </Button>
              </div>
            </div>
          </div>
        )}

        {showViewModal && viewingAnnouncement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => { setShowViewModal(false); setViewingAnnouncement(null) }} />
            <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">Announcement Details</h3>
                <button onClick={() => { setShowViewModal(false); setViewingAnnouncement(null) }} className="p-1 hover:bg-bg-tertiary rounded-lg">
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-muted">Title</label>
                  <p className="text-sm font-semibold text-text-primary">{viewingAnnouncement.title}</p>
                </div>
                <div>
                  <label className="text-xs text-text-muted">Message</label>
                  <p className="text-sm text-text-primary leading-relaxed bg-bg-tertiary rounded-lg p-4 mt-1">{viewingAnnouncement.message}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted">Audience</label>
                    <p className="text-sm text-text-primary mt-1"><Badge variant="default">{viewingAnnouncement.audience}</Badge></p>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted">Publish Date</label>
                    <p className="text-sm text-text-primary mt-1">{viewingAnnouncement.publishDate}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted">Status</label>
                  <p className="mt-1"><Badge variant={STATUS_VARIANT[viewingAnnouncement.status]}>{viewingAnnouncement.status}</Badge></p>
                </div>
              </div>

              <div className="pt-2">
                <Button variant="outline" className="w-full" onClick={() => { setShowViewModal(false); setViewingAnnouncement(null) }}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
