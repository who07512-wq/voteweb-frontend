"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { adminApi, type AdminPositionRecord } from "@/lib/api/admin";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Inbox,
} from "lucide-react";

export default function PositionsPage() {
  const [positions, setPositions] = useState<AdminPositionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [editingPosition, setEditingPosition] = useState<AdminPositionRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    display_order: 1,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getPositions();
      const rows: AdminPositionRecord[] = Array.isArray(res)
        ? res
        : ((res as { data?: AdminPositionRecord[] }).data as AdminPositionRecord[]) || [];
      setPositions(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load positions. Please try again.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleOpenEdit = (position: AdminPositionRecord) => {
    setEditingPosition(position);
    setFormData({
      name: position.name,
      description: position.description || "",
      display_order: position.display_order,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingPosition || !formData.name.trim()) return;
    setSaving(true);
    try {
      await adminApi.updatePosition(editingPosition.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        display_order: formData.display_order,
      });
      showToast("success", `${formData.name} updated.`);
      setIsModalOpen(false);
      setEditingPosition(null);
      await load();
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Update failed. Positions can only be edited while the election is DRAFT or SCHEDULED.");
    }
    setSaving(false);
  };

  const movePosition = async (index: number, direction: -1 | 1) => {
    const target = positions[index + direction];
    const current = positions[index];
    if (!target) return;
    setSaving(true);
    try {
      // Swap display orders in the database, then reload the real order
      await adminApi.updatePosition(current.id, { display_order: target.display_order });
      await adminApi.updatePosition(target.id, { display_order: current.display_order });
      await load();
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Reorder failed.");
    }
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {toast && (
          <div className={`fixed top-4 right-4 z-[70] px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === "success" ? "bg-success" : "bg-error"}`}>
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Election Positions</h1>
            <p className="text-gray-500 mt-1">
              Real positions from the database, grouped per club.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5" disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="p-4 flex items-center gap-3 border-error-200 bg-error-50">
            <AlertTriangle className="w-5 h-5 text-error-500" />
            <p className="text-sm text-error-600">{error}</p>
          </Card>
        )}

        {/* Positions List */}
        {loading ? (
          <Card className="p-12 text-center text-text-secondary">Loading positions…</Card>
        ) : positions.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-gray-100">
                <Inbox className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No Positions</h3>
              <p className="text-gray-500 text-sm max-w-sm">
                No election positions exist in the database yet. Positions are created under clubs when setting up an election.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {positions.map((position, index) => (
              <Card key={position.id} className="p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base">{position.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {position.description || "No description"}
                    </p>
                  </div>
                  <Badge variant={position.is_active ? "success" : "neutral"}>
                    {position.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span>
                    Club ID: <span className="font-medium text-gray-900">{position.club_id}</span>
                  </span>
                  <span>
                    Order: <span className="font-medium text-gray-900">{position.display_order}</span>
                  </span>
                </div>

                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => movePosition(index, -1)}
                      disabled={index === 0 || saving}
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => movePosition(index, 1)}
                      disabled={index === positions.length - 1 || saving}
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => handleOpenEdit(position)}>
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Position Modal — saves to the database */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Position">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. President"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Role responsibilities..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                min={1}
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              Positions can be modified while the election is in DRAFT or SCHEDULED status.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving || !formData.name.trim()}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
