"use client";

import { useWorkspaceStore } from "@/lib/store/workspaceStore";

export function LeftSidebar() {
  const { panelState, setPanelOpen, setModuleDrawerOpen } = useWorkspaceStore();

  return (
    <aside className="h-full overflow-y-auto border-r border-slate-200 bg-white p-3 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Workspace Tools</h2>
        <button className="text-xs text-slate-500" onClick={() => setPanelOpen("left", !panelState.left)}>
          {panelState.left ? "Hide" : "Show"}
        </button>
      </div>
      <div className="space-y-2">
        <button className="w-full rounded border border-slate-200 px-2 py-1 text-left" onClick={() => setModuleDrawerOpen(true)}>
          Automation Modules
        </button>
        <div className="rounded border border-slate-200 p-2 text-xs text-slate-600">
          Use Draw Boundary mode in map/canvas to place new project boundaries.
        </div>
      </div>
    </aside>
  );
}

