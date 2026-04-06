"use client";

import toast from "react-hot-toast";

import { useWorkspaceStore } from "@/lib/store/workspaceStore";
import type { Feature } from "@/lib/types/entities";

export function useViewportControls(selectedBoundary: Feature | null) {
  const { bumpViewportRefresh, setDrawBoundaryDraft, setEditBoundaryDraft } = useWorkspaceStore();

  const fitToBoundary = () => {
    if (!selectedBoundary) {
      toast.error("No boundary selected");
      return;
    }
    bumpViewportRefresh();
  };

  const resetView = () => {
    setDrawBoundaryDraft([]);
    setEditBoundaryDraft([]);
    bumpViewportRefresh();
    toast.success("View reset");
  };

  return { fitToBoundary, resetView };
}
