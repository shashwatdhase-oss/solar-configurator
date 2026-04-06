"use client";

import { useEffect, useMemo } from "react";
import toast from "react-hot-toast";

import { CanvasView } from "@/components/canvas/CanvasView";
import { MapView } from "@/components/map/MapView";
import { BottomPanel } from "@/components/workspace/BottomPanel";
import { LeftSidebar } from "@/components/workspace/LeftSidebar";
import { ModuleDrawer } from "@/components/workspace/ModuleDrawer";
import { ReportsView } from "@/components/workspace/ReportsView";
import { RightSidebar } from "@/components/workspace/RightSidebar";
import { TerrainView } from "@/components/workspace/TerrainView";
import { TopToolbar } from "@/components/workspace/TopToolbar";
import { geometryApi } from "@/lib/api/geometryApi";
import { useBoundaryEditor } from "@/lib/hooks/useBoundaryEditor";
import { useWorkspaceData } from "@/lib/hooks/useWorkspaceData";
import { useViewportControls } from "@/lib/hooks/useViewportControls";
import { useWorkspaceStore } from "@/lib/store/workspaceStore";

interface WorkspacePageProps {
  params: { projectId: string };
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const projectId = Number(params.projectId);
  const { loading, error, reports, terrain, reload } = useWorkspaceData(projectId);

  const {
    workspaceView,
    features,
    layers,
    jobs,
    panelState,
    activeTool,
    selectedFeatureIds,
    setSelectedFeatureIds,
    bumpViewportRefresh,
  } = useWorkspaceStore();
  const { boundaries, selectedBoundary, saveBoundary, cancelEdit, startEdit, startDraw, deleteBoundary } =
    useBoundaryEditor(projectId);
  const { fitToBoundary, resetView } = useViewportControls(selectedBoundary);

  const tableLayer = useMemo(() => layers.find((layer) => layer.layer_type === "table"), [layers]);

  useEffect(() => {
    bumpViewportRefresh();
  }, [workspaceView, panelState.left, panelState.right, bumpViewportRefresh]);

  const deleteSelectedFeatures = async () => {
    if (selectedFeatureIds.length === 0) {
      toast.error("No feature selected");
      return;
    }

    try {
      await geometryApi.bulkDelete(selectedFeatureIds);
      setSelectedFeatureIds([]);
      await reload();
      toast.success("Selected features deleted");
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to delete selected features";
      toast.error(message);
    }
  };

  if (loading) return <main className="p-6">Loading workspace...</main>;
  if (error) return <main className="p-6 text-red-700">{error}</main>;

  return (
    <main className="flex h-screen min-h-0 flex-col">
      <TopToolbar
        onFitBoundary={fitToBoundary}
        onResetView={resetView}
        onSaveBoundary={saveBoundary}
        onCancelBoundaryEdit={cancelEdit}
      />

      <div className="flex min-h-0 flex-1">
        {panelState.left && (
          <div className="w-64 min-h-0">
            <LeftSidebar />
          </div>
        )}

        <section className="relative flex min-h-0 flex-1 flex-col bg-ui-base p-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">Project Workspace #{projectId}</div>
            <div className="flex gap-2">
              <button className="rounded border border-slate-300 px-2 py-1 text-xs" onClick={startDraw}>
                Draw Boundary
              </button>
              <button className="rounded border border-slate-300 px-2 py-1 text-xs" onClick={fitToBoundary}>
                Go To Boundary
              </button>
              <button
                className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                onClick={() => void deleteSelectedFeatures()}
              >
                Delete Selected
              </button>
              <ModuleDrawer projectId={projectId} tableLayer={tableLayer} onRefresh={reload} />
            </div>
          </div>

          {(activeTool === "draw-boundary" || activeTool === "edit-boundary") && (
            <div className="mb-2 flex items-center gap-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs">
              <span className="font-medium text-amber-900">
                {activeTool === "draw-boundary" ? "Drawing boundary..." : "Editing boundary..."}
              </span>
              <button className="rounded bg-emerald-700 px-2 py-1 text-white" onClick={() => void saveBoundary()}>
                Save Boundary
              </button>
              <button className="rounded bg-slate-600 px-2 py-1 text-white" onClick={cancelEdit}>
                Cancel Edit
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1">
            {workspaceView === "map" && <MapView features={features} layers={layers} />}
            {workspaceView === "canvas2d" && <CanvasView features={features} layers={layers} />}
            {workspaceView === "terrain3d" && <TerrainView terrain={terrain} />}
            {workspaceView === "reports" && (
              <ReportsView projectId={projectId} reports={reports} onReload={reload} />
            )}
          </div>
        </section>

        {panelState.right && (
          <div className="w-80 min-h-0">
            <RightSidebar
              projectId={projectId}
              layers={layers}
              boundaries={boundaries}
              selectedBoundary={selectedBoundary}
              onRefresh={reload}
              onStartEdit={startEdit}
              onDeleteBoundary={deleteBoundary}
            />
          </div>
        )}
      </div>

      {panelState.bottom && (
        <div className="h-44 min-h-0">
          <BottomPanel jobs={jobs} />
        </div>
      )}
    </main>
  );
}
