"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

import { createViewportTransform, getFeatureBounds, screenToWorld, worldToScreen } from "@/lib/geometry/utils";
import { useWorkspaceStore } from "@/lib/store/workspaceStore";
import type { Feature, Layer } from "@/lib/types/entities";

interface CanvasViewProps {
  features: Feature[];
  layers: Layer[];
}

export function CanvasView({ features, layers }: CanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 1000, height: 700 });
  const [dragVertexIndex, setDragVertexIndex] = useState<number | null>(null);

  const {
    selectedBoundaryId,
    selectedFeatureIds,
    activeTool,
    drawBoundaryDraft,
    editBoundaryDraft,
    setSelectedBoundaryId,
    setSelectedFeatureIds,
    setDrawBoundaryDraft,
    setEditBoundaryDraft,
    viewportRefreshVersion,
  } = useWorkspaceStore();

  useEffect(() => {
    const update = () => {
      if (!wrapperRef.current) return;
      setSize({ width: wrapperRef.current.clientWidth, height: wrapperRef.current.clientHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const visibleFeatures = useMemo(() => {
    const visibleIds = new Set(layers.filter((l) => l.visible).map((l) => l.id));
    return features.filter((f) => visibleIds.has(f.layer_id));
  }, [features, layers]);

  const transform = useMemo(() => {
    const bounds = getFeatureBounds(visibleFeatures);
    if (!bounds) {
      return { scale: 50000, offsetX: size.width / 2, offsetY: size.height / 2 };
    }
    return createViewportTransform(bounds, size.width, size.height, 40);
  }, [size.width, size.height, visibleFeatures, viewportRefreshVersion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, size.width, size.height);

    visibleFeatures.forEach((feature) => {
      const layer = layers.find((l) => l.id === feature.layer_id);
      const selected = feature.id === selectedBoundaryId;

      if (feature.geometry.type === "Polygon") {
        const ring = (feature.geometry.coordinates as [number, number][][])[0];
        if (!ring || ring.length < 3) return;
        const isTable = feature.feature_type === "table";

        ctx.beginPath();
        ring.forEach((coord, i) => {
          const p = worldToScreen([coord[0], coord[1]], transform, size.height);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fillStyle = isTable ? "rgba(0, 0, 0, 0)" : selected ? "rgba(15, 118, 110, 0.15)" : "rgba(14, 165, 233, 0.06)";
        const isSelectedFeature = selectedFeatureIds.includes(feature.id) && feature.feature_type !== "boundary";
        ctx.strokeStyle = isTable ? "#111827" : selected ? "#0f766e" : layer?.style.color ?? "#0ea5e9";
        ctx.lineWidth = isSelectedFeature ? (layer?.style.lineWidth ?? 2) + 2 : selected ? 3 : layer?.style.lineWidth ?? 2;
        ctx.fill();
        ctx.stroke();

        if (selected && activeTool === "edit-boundary") {
          const vertices = editBoundaryDraft.length > 0 ? editBoundaryDraft : ring.slice(0, -1);
          vertices.forEach((v) => {
            const p = worldToScreen(v, transform, size.height);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = "#f59e0b";
            ctx.fill();
          });
        }
      } else if (feature.geometry.type === "LineString") {
        const line = feature.geometry.coordinates as [number, number][];
        if (line.length < 2) return;
        ctx.beginPath();
        line.forEach((coord, i) => {
          const p = worldToScreen([coord[0], coord[1]], transform, size.height);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = layer?.style.color ?? "#0ea5e9";
        const isSelectedFeature = selectedFeatureIds.includes(feature.id);
        ctx.lineWidth = isSelectedFeature ? (layer?.style.lineWidth ?? 2) + 2 : layer?.style.lineWidth ?? 2;
        ctx.stroke();
      } else if (feature.geometry.type === "Point") {
        const [x, y] = feature.geometry.coordinates as [number, number];
        const p = worldToScreen([x, y], transform, size.height);
        const isPile = feature.feature_type === "pile";
        ctx.beginPath();
        ctx.arc(p.x, p.y, selectedFeatureIds.includes(feature.id) ? 5 : isPile ? 4 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isPile ? "#f59e0b" : layer?.style.color ?? "#0ea5e9";
        ctx.fill();
        if (isPile) {
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#111827";
          ctx.stroke();
        }
      }
    });

    if (activeTool === "draw-boundary" && drawBoundaryDraft.length > 0) {
      ctx.beginPath();
      drawBoundaryDraft.forEach((coord, i) => {
        const p = worldToScreen([coord[0], coord[1]], transform, size.height);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [visibleFeatures, layers, selectedBoundaryId, selectedFeatureIds, activeTool, drawBoundaryDraft, editBoundaryDraft, size.width, size.height, transform]);

  const findFeatureAtPoint = (x: number, y: number): Feature | null => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return null;

    for (const feature of visibleFeatures) {
      if (feature.geometry.type === "Polygon") {
        const ring = (feature.geometry.coordinates as [number, number][][])[0];
        ctx.beginPath();
        ring.forEach((coord, i) => {
          const p = worldToScreen([coord[0], coord[1]], transform, size.height);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        if (ctx.isPointInPath(x, y)) return feature;
      }

      if (feature.geometry.type === "Point") {
        const [px, py] = feature.geometry.coordinates as [number, number];
        const screenPoint = worldToScreen([px, py], transform, size.height);
        if (Math.hypot(screenPoint.x - x, screenPoint.y - y) <= 8) return feature;
      }
    }
    return null;
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (activeTool === "draw-boundary") {
      const world = screenToWorld({ x, y }, transform, size.height);
      setDrawBoundaryDraft([...drawBoundaryDraft, world]);
      return;
    }

    if (activeTool === "edit-boundary") {
      const source = editBoundaryDraft;
      const idx = source.findIndex((v) => {
        const p = worldToScreen(v, transform, size.height);
        return Math.hypot(p.x - x, p.y - y) <= 8;
      });
      if (idx >= 0) {
        setDragVertexIndex(idx);
        return;
      }

      const world = screenToWorld({ x, y }, transform, size.height);
      setEditBoundaryDraft([...source, world]);
      return;
    }

    const selected = findFeatureAtPoint(x, y);
    if (selected?.feature_type === "boundary") {
      setSelectedBoundaryId(selected.id);
      setSelectedFeatureIds([]);
      return;
    }

    if (selected) {
      setSelectedFeatureIds([selected.id]);
      return;
    }

    setSelectedBoundaryId(null);
    setSelectedFeatureIds([]);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (dragVertexIndex === null || activeTool !== "edit-boundary") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const world = screenToWorld({ x, y }, transform, size.height);

    const next = [...editBoundaryDraft];
    next[dragVertexIndex] = world;
    setEditBoundaryDraft(next);
  };

  const handlePointerUp = () => setDragVertexIndex(null);

  return (
    <div ref={wrapperRef} className="relative h-full w-full overflow-hidden rounded border border-slate-200 bg-slate-50">
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        className="h-full w-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-white/80 px-2 py-1 text-xs text-slate-600">
        WGS84 coordinate rendering for canvas/map parity
      </div>
    </div>
  );
}

