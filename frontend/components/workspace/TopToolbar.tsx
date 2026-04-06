"use client";

import { useWorkspaceStore, type WorkspaceView } from "@/lib/store/workspaceStore";

interface TopToolbarProps {
  onFitBoundary: () => void;
  onResetView: () => void;
  onSaveBoundary: () => Promise<void>;
  onCancelBoundaryEdit: () => void;
}

const views: { key: WorkspaceView; label: string }[] = [
  { key: "canvas2d", label: "2D Canvas" },
  { key: "map", label: "Map View" },
  { key: "terrain3d", label: "3D Terrain" },
  { key: "reports", label: "Reports" },
];

export function TopToolbar({ onFitBoundary, onResetView, onSaveBoundary, onCancelBoundaryEdit }: TopToolbarProps) {
  const { workspaceView, setWorkspaceView, activeTool, setActiveTool, panelState, setPanelOpen } = useWorkspaceStore();

  return (
    <header className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-1">
      <div className="flex flex-wrap items-center gap-2">
        {views.map((view) => (
          <button
            key={view.key}
            className={`rounded px-2 py-1 text-sm ${workspaceView === view.key ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-700"}`}
            onClick={() => setWorkspaceView(view.key)}
          >
            {view.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button className={`rounded px-2 py-1 ${activeTool === "select" ? "bg-slate-800 text-white" : "bg-slate-100"}`} onClick={() => setActiveTool("select")}>
          Select
        </button>
        <button
          className={`rounded px-2 py-1 ${activeTool === "draw-boundary" ? "bg-amber-600 text-white" : "bg-slate-100"}`}
          onClick={() => setActiveTool("draw-boundary")}
        >
          Draw Boundary
        </button>
        <button
          className={`rounded px-2 py-1 ${activeTool === "edit-boundary" ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
          onClick={() => setActiveTool("edit-boundary")}
        >
          Edit Boundary
        </button>
        <button className="rounded bg-emerald-700 px-2 py-1 text-white" onClick={() => void onSaveBoundary()}>Save Boundary</button>
        <button className="rounded bg-slate-500 px-2 py-1 text-white" onClick={onCancelBoundaryEdit}>Cancel Edit</button>
        <button className="rounded bg-slate-100 px-2 py-1" onClick={onFitBoundary}>Go To Boundary</button>
        <button className="rounded bg-slate-100 px-2 py-1" onClick={onResetView}>Reset View</button>
        <button className="rounded bg-slate-100 px-2 py-1" onClick={() => setPanelOpen("left", !panelState.left)}>{panelState.left ? "Hide Left" : "Show Left"}</button>
        <button className="rounded bg-slate-100 px-2 py-1" onClick={() => setPanelOpen("right", !panelState.right)}>{panelState.right ? "Hide Right" : "Show Right"}</button>
        <button className="rounded bg-slate-100 px-2 py-1" onClick={() => setPanelOpen("bottom", !panelState.bottom)}>{panelState.bottom ? "Hide Bottom" : "Show Bottom"}</button>
      </div>
    </header>
  );
}

