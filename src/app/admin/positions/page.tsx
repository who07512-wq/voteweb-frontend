"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/admin-dashboard/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { MOCK_POSITIONS, ElectionPosition } from "@/lib/admin-dashboard-data";
import {
  Plus,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  BarChart3,
} from "lucide-react";

export default function PositionsPage() {
  const [positions, setPositions] = useState<ElectionPosition[]>(MOCK_POSITIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<ElectionPosition | null>(null);
  const [deletingPosition, setDeletingPosition] = useState<ElectionPosition | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxCandidates: 3,
    order: 1,
    status: "Active" as "Active" | "Inactive",
  });

  const handleOpenAdd = () => {
    setEditingPosition(null);
    setFormData({
      name: "",
      description: "",
      maxCandidates: 3,
      order: positions.length + 1,
      status: "Active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (position: ElectionPosition) => {
    setEditingPosition(position);
    setFormData({
      name: position.name,
      description: position.description,
      maxCandidates: position.maxCandidates,
      order: position.order,
      status: position.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingPosition) {
      setPositions((prev) =>
        prev.map((p) =>
          p.id === editingPosition.id
            ? { ...p, ...formData }
            : p
        )
      );
    } else {
      const newPosition: ElectionPosition = {
        id: `pos-${Date.now()}`,
        ...formData,
        currentCandidates: 0,
      };
      setPositions((prev) => [...prev, newPosition]);
    }
    setIsModalOpen(false);
    setEditingPosition(null);
  };

  const handleOpenDelete = (position: ElectionPosition) => {
    setDeletingPosition(position);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (deletingPosition) {
      setPositions((prev) => prev.filter((p) => p.id !== deletingPosition.id));
    }
    setIsDeleteModalOpen(false);
    setDeletingPosition(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setPositions((prev) => {
      const updated = [...prev];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      return updated.map((p, i) => ({ ...p, order: i + 1 }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === positions.length - 1) return;
    setPositions((prev) => {
      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated.map((p, i) => ({ ...p, order: i + 1 }));
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Election Positions</h1>
            <p className="text-gray-500 mt-1">
              Manage election positions and their configuration.
            </p>
          </div>
          <Button variant="primary" onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Position
          </Button>
        </div>

        {/* Positions List */}
        {positions.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-gray-100">
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No Positions</h3>
              <p className="text-gray-500 text-sm max-w-sm">
                No election positions have been created yet. Add a position to get started.
              </p>
              <Button variant="primary" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add Position
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {positions.map((position, index) => (
              <Card key={position.id} className="p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base">
                      {position.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {position.description}
                    </p>
                  </div>
                  <Badge variant={position.status === "Active" ? "success" : "neutral"}>
                    {position.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span>
                    Candidates:{" "}
                    <span className="font-medium text-gray-900">
                      {position.currentCandidates}
                    </span>{" "}
                    / {position.maxCandidates}
                  </span>
                  <span>
                    Order:{" "}
                    <span className="font-medium text-gray-900">{position.order}</span>
                  </span>
                </div>

                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === positions.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(position)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDelete(position)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add / Edit Position Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPosition(null);
          }}
          title={editingPosition ? "Edit Position" : "Add Position"}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Position Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. President"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe the role and responsibilities..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Maximum Candidates
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.maxCandidates}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      maxCandidates: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      order: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as "Active" | "Inactive",
                  }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPosition(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={!formData.name.trim()}
              >
                {editingPosition ? "Save Changes" : "Add Position"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingPosition(null);
          }}
          title="Delete Position?"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{deletingPosition?.name}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingPosition(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
