"use client";

import { useMemo } from "react";
import toast from "react-hot-toast";

import { geometryApi } from "@/lib/api/geometryApi";
import { useWorkspaceStore } from "@/lib/store/workspaceStore";
import { buildBoundaryGeometry, validateBoundaryCoordinates } from "@/lib/geometry/utils";
import type { Feature } from "@/lib/types/entities";

export function useBoundaryEditor(projectId: number) {
  const {
    layers,
    features,
    selectedBoundaryId,
    activeTool,
    drawBoundaryDraft,
    editBoundaryDraft,
    setActiveTool,
    setFeatures,
    setSelectedBoundaryId,
    setDrawBoundaryDraft,
    setEditBoundaryDraft,
    resetBoundaryDrafts,
    bumpViewportRefresh,
  } = useWorkspaceStore();

  const boundaryLayer = useMemo(() => layers.find((l) => l.layer_type === "boundary"), [layers]);

  const boundaries = useMemo(
    () => features.filter((f) => f.feature_type === "boundary" && f.is_active),
    [features],
  );

  const selectedBoundary = useMemo(
    () => boundaries.find((b) => b.id === selectedBoundaryId) ?? null,
    [boundaries, selectedBoundaryId],
  );

  const startDraw = () => {
    setActiveTool("draw-boundary");
    setDrawBoundaryDraft([]);
    toast("Drawing boundary...");
  };

  const startEdit = () => {
    if (!selectedBoundary) {
      toast.error("No boundary selected");
      return;
    }
    const ring = selectedBoundary.geometry.coordinates as [number, number][][];
    setEditBoundaryDraft(ring[0].slice(0, -1));
    setActiveTool("edit-boundary");
    toast("Editing boundary...");
  };

  const cancelEdit = () => {
    setActiveTool("select");
    resetBoundaryDrafts();
    toast.success("Boundary edit canceled");
  };

  const saveBoundary = async () => {
    if (!boundaryLayer) {
      toast.error("Boundary layer missing");
      return;
    }

    const draft = activeTool === "draw-boundary" ? drawBoundaryDraft : editBoundaryDraft;
    const validationError = validateBoundaryCoordinates(draft);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const geometry = buildBoundaryGeometry(draft);
    try {
      if (activeTool === "draw-boundary") {
        const createResp = await geometryApi.create({
          project_id: projectId,
          layer_id: boundaryLayer.id,
          feature_type: "boundary",
          name: `Boundary-${Date.now()}`,
          geometry,
          properties: {},
        });
        const feature = await geometryApi.get(createResp.id);
        setFeatures([...features, feature]);
        setSelectedBoundaryId(feature.id);
      } else if (activeTool === "edit-boundary" && selectedBoundaryId) {
        await geometryApi.update(selectedBoundaryId, { geometry });
        const updated = await geometryApi.get(selectedBoundaryId);
        setFeatures(features.map((f) => (f.id === updated.id ? updated : f)));
      }

      setActiveTool("select");
      resetBoundaryDrafts();
      bumpViewportRefresh();
      toast.success("Boundary saved successfully");
    } catch (error: unknown) {
      const message = error && typeof error === "object" && "message" in error ? String(error.message) : "Failed to save boundary";
      toast.error(message);
    }
  };

  const deleteBoundary = async (feature: Feature) => {
    await geometryApi.remove(feature.id);
    setFeatures(features.filter((f) => f.id !== feature.id));
    if (selectedBoundaryId === feature.id) {
      setSelectedBoundaryId(null);
    }
    toast.success("Boundary deleted");
  };

  return {
    boundaries,
    selectedBoundary,
    selectedBoundaryId,
    boundaryLayer,
    startDraw,
    startEdit,
    cancelEdit,
    saveBoundary,
    deleteBoundary,
  };
}

