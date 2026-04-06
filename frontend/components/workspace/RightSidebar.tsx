"use client";

import { useMemo } from "react";
import toast from "react-hot-toast";

import { projectsApi } from "@/lib/api/projectsApi";
import { featureAreaSqM } from "@/lib/geometry/utils";
import { useWorkspaceStore } from "@/lib/store/workspaceStore";
import type { Feature, Layer } from "@/lib/types/entities";

interface RightSidebarProps {
  projectId: number;
  layers: Layer[];
  boundaries: Feature[];
  selectedBoundary: Feature | null;
  onRefresh: () => Promise<void>;
  onStartEdit: () => void;
  onDeleteBoundary: (feature: Feature) => Promise<void>;
}

export function RightSidebar({
  projectId,
  layers,
  boundaries,
  selectedBoundary,
  onRefresh,
  onStartEdit,
  onDeleteBoundary,
}: RightSidebarProps) {
  const { selectedBoundaryId, setSelectedBoundaryId, setLayers, bumpViewportRefresh } = useWorkspaceStore();
  const selectedBoundaryAreaSqM = useMemo(() => featureAreaSqM(selectedBoundary), [selectedBoundary]);

  const toggleLayer = async (layer: Layer, field: "visible" | "locked") => {
    await projectsApi.updateLayer(layer.id, { [field]: !layer[field] });
    const latest = await projectsApi.listLayers(projectId);
    setLayers(latest);
  };

  return (
    <aside className="h-full overflow-y-auto border-l border-slate-200 bg-white p-3 text-sm">
      {selectedBoundary && (
        <div className="mb-3 rounded border border-emerald-200 bg-emerald-50 p-3">
          <div className="text-xs font-semibold text-emerald-900">Selected Boundary</div>
          <div className="mt-1 text-xs text-emerald-800">
            {selectedBoundary.name ?? `Boundary ${selectedBoundary.id}`}
          </div>
          <div className="mt-2 text-xs text-emerald-900">
            Area: {selectedBoundaryAreaSqM.toLocaleString(undefined, { maximumFractionDigits: 0 })} sq m
          </div>
        </div>
      )}

      <h2 className="mb-2 font-semibold">Boundaries</h2>
      <div className="space-y-2">
        {boundaries.length === 0 ? (
          <div className="text-xs text-slate-500">No saved boundary yet.</div>
        ) : (
          boundaries.map((boundary) => (
            <div
              key={boundary.id}
              className={`rounded border p-2 ${
                selectedBoundaryId === boundary.id ? "border-teal-600 bg-teal-50" : "border-slate-200"
              }`}
            >
              <div className="text-xs font-medium">{boundary.name ?? `Boundary ${boundary.id}`}</div>
              <div className="mt-2 flex gap-1 text-xs">
                <button className="rounded border px-2 py-0.5" onClick={() => setSelectedBoundaryId(boundary.id)}>
                  Select
                </button>
                <button
                  className="rounded border px-2 py-0.5"
                  onClick={() => {
                    setSelectedBoundaryId(boundary.id);
                    bumpViewportRefresh();
                    toast.success("Focused boundary");
                  }}
                >
                  Focus
                </button>
                <button
                  className="rounded border px-2 py-0.5"
                  onClick={() => {
                    setSelectedBoundaryId(boundary.id);
                    onStartEdit();
                  }}
                >
                  Edit
                </button>
                <button
                  className="rounded border border-red-300 px-2 py-0.5 text-red-700"
                  onClick={() => void onDeleteBoundary(boundary)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <h2 className="mb-2 mt-4 font-semibold">Layers</h2>
      <div className="space-y-2">
        {layers.map((layer) => (
          <div key={layer.id} className="rounded border border-slate-200 p-2 text-xs">
            <div className="font-medium">{layer.name}</div>
            <div className="mt-1 flex gap-1">
              <button className="rounded border px-2 py-0.5" onClick={() => void toggleLayer(layer, "visible")}>
                {layer.visible ? "Hide" : "Show"}
              </button>
              <button className="rounded border px-2 py-0.5" onClick={() => void toggleLayer(layer, "locked")}>
                {layer.locked ? "Unlock" : "Lock"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 rounded bg-slate-100 px-2 py-1 text-xs" onClick={() => void onRefresh()}>
        Reload Data
      </button>
    </aside>
  );
}
