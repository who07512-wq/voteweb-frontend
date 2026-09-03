"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_SCHEDULE } from "@/lib/admin-dashboard-data";
import { Calendar, Clock, CheckCircle2, Edit, Plus, X } from "lucide-react";

export default function AdminSchedulePage() {
  const [schedule, setSchedule] = useState(MOCK_SCHEDULE);
  const [editEvent, setEditEvent] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [formData, setFormData] = useState({ event: "", date: "", time: "", description: "" });

  const handleEdit = (event: typeof schedule[0]) => {
    setEditEvent(event.id);
    setFormData({ event: event.event, date: event.date, time: event.time, description: event.description });
  };

  const handleSave = () => {
    setShowSaveModal(true);
  };

  const confirmSave = () => {
    if (editEvent) {
      setSchedule((prev) =>
        prev.map((e) =>
          e.id === editEvent ? { ...e, ...formData } : e
        )
      );
    } else {
      setSchedule((prev) => [
        ...prev,
        { id: `s-${Date.now()}`, ...formData, status: "Upcoming" as const },
      ]);
    }
    setShowSaveModal(false);
    setEditEvent(null);
    setShowAddModal(false);
    setFormData({ event: "", date: "", time: "", description: "" });
  };

  const handleAdd = () => {
    setEditEvent(null);
    setFormData({ event: "", date: "", time: "", description: "" });
    setShowAddModal(true);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Election Schedule</h1>
            <p className="text-sm text-text-secondary">Manage the election timeline and important dates.</p>
          </div>
          <Button variant="primary" size="sm" className="gap-1.5" onClick={handleAdd}>
            <Plus className="w-3.5 h-3.5" />
            Add Event
          </Button>
        </div>

        <Card className="p-6 border-border">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-5">
              {schedule.map((event) => {
                const statusVariant =
                  event.status === "Completed"
                    ? "success"
                    : event.status === "In Progress"
                    ? "warning"
                    : "info";
                return (
                  <div key={event.id} className="flex items-start gap-4 relative">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                        event.status === "Completed"
                          ? "bg-success"
                          : event.status === "In Progress"
                          ? "bg-warning"
                          : "bg-primary-100"
                      }`}
                    >
                      {event.status === "Completed" ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : event.status === "In Progress" ? (
                        <Clock className="w-4 h-4 text-white" />
                      ) : (
                        <Calendar className="w-4 h-4 text-primary-600" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{event.event}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-text-secondary">{event.date}</p>
                            {event.time !== "—" && (
                              <>
                                <span className="text-text-muted">•</span>
                                <p className="text-xs text-text-secondary">{event.time}</p>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary mt-1">{event.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={statusVariant as "success" | "warning" | "info"} className="text-[10px]">
                            {event.status}
                          </Badge>
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-1.5 rounded-lg hover:bg-primary-50 text-text-muted hover:text-primary-600 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {(editEvent || showAddModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setEditEvent(null); setShowAddModal(false); }} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary">
                {editEvent ? "Edit Event" : "Add Event"}
              </h3>
              <button onClick={() => { setEditEvent(null); setShowAddModal(false); }} className="p-1 rounded-lg hover:bg-primary-50">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider block mb-1">Event Name</label>
                <input value={formData.event} onChange={(e) => setFormData((p) => ({ ...p, event: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider block mb-1">Date</label>
                  <input value={formData.date} onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider block mb-1">Time</label>
                  <input value={formData.time} onChange={(e) => setFormData((p) => ({ ...p, time: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider block mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" size="md" className="flex-1" onClick={() => { setEditEvent(null); setShowAddModal(false); }}>Cancel</Button>
              <Button variant="primary" size="md" className="flex-1" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSaveModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-text-primary">Save Schedule Changes?</h3>
            <p className="text-sm text-text-secondary">Are you sure you want to update this event?</p>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" size="md" className="flex-1" onClick={() => setShowSaveModal(false)}>Cancel</Button>
              <Button variant="primary" size="md" className="flex-1" onClick={confirmSave}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
