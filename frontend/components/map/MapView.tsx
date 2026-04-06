"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { useWorkspaceStore } from "@/lib/store/workspaceStore";
import type { Feature, Layer } from "@/lib/types/entities";

const LeafletCanvas = dynamic(() => import("@/components/map/MapViewInner").then((m) => m.MapViewInner), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center">Loading map...</div>,
});

interface MapViewProps {
  features: Feature[];
  layers: Layer[];
}

export function MapView({ features, layers }: MapViewProps) {
  const { selectedBoundaryId, activeTool, viewportRefreshVersion } = useWorkspaceStore();

  const visibleFeatures = useMemo(() => {
    const visibleLayerIds = new Set(layers.filter((l) => l.visible).map((l) => l.id));
    return features.filter((f) => visibleLayerIds.has(f.layer_id));
  }, [features, layers]);

  const mapRenderKey = `${viewportRefreshVersion}-${visibleFeatures.length}-${selectedBoundaryId ?? "none"}`;

  return (
    <LeafletCanvas
      key={mapRenderKey}
      features={visibleFeatures}
      layers={layers}
      selectedBoundaryId={selectedBoundaryId}
      activeTool={activeTool}
      viewportRefreshVersion={viewportRefreshVersion}
    />
  );
}

