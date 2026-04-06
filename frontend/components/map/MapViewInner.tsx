"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { CircleMarker, FeatureGroup, MapContainer, Polygon, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { LatLngBoundsExpression, LatLngExpression } from "leaflet";

import type { Feature, Layer } from "@/lib/types/entities";
import type { WorkspaceTool } from "@/lib/store/workspaceStore";
import { useWorkspaceStore } from "@/lib/store/workspaceStore";

interface Props {
  features: Feature[];
  layers: Layer[];
  selectedBoundaryId: number | null;
  activeTool: WorkspaceTool;
  viewportRefreshVersion: number;
}

function FitOnRefresh({ bounds, refreshVersion }: { bounds: LatLngBoundsExpression | null; refreshVersion: number }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    if (bounds) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 20 });
    }
  }, [bounds, map, refreshVersion]);

  return null;
}

function SyncMapSize({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  const map = useMap();

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, map]);

  return null;
}

function MapInteraction({
  activeTool,
  selectedBoundaryId,
  drawBoundaryDraft,
  editBoundaryDraft,
  setDrawBoundaryDraft,
  setEditBoundaryDraft,
}: {
  activeTool: WorkspaceTool;
  selectedBoundaryId: number | null;
  drawBoundaryDraft: [number, number][];
  editBoundaryDraft: [number, number][];
  setDrawBoundaryDraft: (coords: [number, number][]) => void;
  setEditBoundaryDraft: (coords: [number, number][]) => void;
}) {
  useMapEvents({
    click(event) {
      const lngLat: [number, number] = [event.latlng.lng, event.latlng.lat];
      if (activeTool === "draw-boundary") {
        setDrawBoundaryDraft([...drawBoundaryDraft, lngLat]);
        return;
      }
      if (activeTool === "edit-boundary" && selectedBoundaryId) {
        setEditBoundaryDraft([...editBoundaryDraft, lngLat]);
      }
    },
  });

  return null;
}

export function MapViewInner({ features, layers, selectedBoundaryId, activeTool, viewportRefreshVersion }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setSelectedBoundaryId = useWorkspaceStore((s) => s.setSelectedBoundaryId);
  const selectedFeatureIds = useWorkspaceStore((s) => s.selectedFeatureIds);
  const setSelectedFeatureIds = useWorkspaceStore((s) => s.setSelectedFeatureIds);
  const setDrawBoundaryDraft = useWorkspaceStore((s) => s.setDrawBoundaryDraft);
  const drawBoundaryDraft = useWorkspaceStore((s) => s.drawBoundaryDraft);
  const editBoundaryDraft = useWorkspaceStore((s) => s.editBoundaryDraft);
  const setEditBoundaryDraft = useWorkspaceStore((s) => s.setEditBoundaryDraft);

  const boundaries = useMemo(() => features.filter((f) => f.feature_type === "boundary"), [features]);

  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    const focusBoundary = selectedBoundaryId
      ? boundaries.find((boundary) => boundary.id === selectedBoundaryId) ?? null
      : null;
    const points: LatLngExpression[] = [];
    (focusBoundary ? [focusBoundary] : boundaries).forEach((boundary) => {
      const coords = boundary.geometry.coordinates as [number, number][][];
      coords[0]?.forEach((xy) => points.push([xy[1], xy[0]]));
    });
    if (points.length === 0) return null;
    return points as LatLngBoundsExpression;
  }, [boundaries, selectedBoundaryId]);

  return (
    <div ref={containerRef} className="h-full w-full min-h-0">
      <MapContainer center={[26.915, 72.62]} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <SyncMapSize containerRef={containerRef} />
        <MapInteraction
          activeTool={activeTool}
          selectedBoundaryId={selectedBoundaryId}
          drawBoundaryDraft={drawBoundaryDraft}
          editBoundaryDraft={editBoundaryDraft}
          setDrawBoundaryDraft={setDrawBoundaryDraft}
          setEditBoundaryDraft={setEditBoundaryDraft}
        />
        <FeatureGroup>
          {features.map((feature) => {
            const layer = layers.find((l) => l.id === feature.layer_id);
            const color = feature.id === selectedBoundaryId ? "#0f766e" : layer?.style?.color ?? "#0ea5e9";
            const weight = feature.id === selectedBoundaryId ? 4 : layer?.style?.lineWidth ?? 2;

            try {
              if (feature.geometry.type === "Point") {
                const [x, y] = feature.geometry.coordinates as [number, number];
                const isPile = feature.feature_type === "pile";
                return (
                  <CircleMarker
                    key={feature.id}
                    center={[y, x]}
                    radius={isPile ? 5 : 4}
                    pathOptions={{
                      color: isPile ? "#111827" : color,
                      fillColor: isPile ? "#f59e0b" : color,
                      fillOpacity: 0.95,
                      weight: isPile ? 2 : 1,
                    }}
                    eventHandlers={{
                      click: () => {
                        if (feature.feature_type === "boundary") {
                          setSelectedBoundaryId(feature.id);
                          setSelectedFeatureIds([]);
                        } else {
                          setSelectedFeatureIds([feature.id]);
                        }
                      },
                    }}
                  />
                );
              }

              if (feature.geometry.type === "LineString") {
                const coords = feature.geometry.coordinates as [number, number][];
                return (
                  <Polyline
                    key={feature.id}
                    positions={coords.map((xy) => [xy[1], xy[0]] as [number, number])}
                    pathOptions={{ color, weight: selectedFeatureIds.includes(feature.id) ? weight + 2 : weight }}
                    eventHandlers={{
                      click: () => {
                        setSelectedFeatureIds([feature.id]);
                      },
                    }}
                  />
                );
              }

              if (feature.geometry.type === "Polygon") {
                const coords = feature.geometry.coordinates as [number, number][][];
                const polygonPositions = coords[0]?.map((xy) => [xy[1], xy[0]] as [number, number]);
                if (!polygonPositions || polygonPositions.length < 3) return null;
                const isTable = feature.feature_type === "table";
                const polygonColor = isTable ? "#111827" : color;
                return (
                  <Polygon
                    key={feature.id}
                    positions={polygonPositions}
                    pathOptions={{
                      color: polygonColor,
                      weight: selectedFeatureIds.includes(feature.id) && feature.feature_type !== "boundary" ? weight + 2 : weight,
                      fillOpacity: isTable ? 0 : feature.id === selectedBoundaryId ? 0.18 : 0.08,
                    }}
                    eventHandlers={{
                      click: () => {
                        if (feature.feature_type === "boundary") {
                          setSelectedBoundaryId(feature.id);
                          setSelectedFeatureIds([]);
                        } else {
                          setSelectedFeatureIds([feature.id]);
                        }
                      },
                    }}
                  />
                );
              }
            } catch {
              return null;
            }

            return null;
          })}

          {activeTool === "edit-boundary" && selectedBoundaryId && (() => {
            const selected = boundaries.find((b) => b.id === selectedBoundaryId);
            if (!selected) return null;
            const ring = selected.geometry.coordinates as [number, number][][];
            const vertices = editBoundaryDraft.length > 0 ? editBoundaryDraft : ring[0].slice(0, -1);
            return (
              <>
                {vertices.map((xy, idx) => (
                  <CircleMarker
                    key={`vertex-${idx}`}
                    center={[xy[1], xy[0]]}
                    radius={5}
                    pathOptions={{ color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 1 }}
                    eventHandlers={{
                      click: () => {
                        // Lightweight midpoint insert flow: clicking a vertex removes it when polygon stays valid.
                        if (vertices.length <= 3) return;
                        const next = vertices.filter((_, i) => i !== idx);
                        setEditBoundaryDraft(next);
                      },
                    }}
                  />
                ))}
                {vertices.map((xy, idx) => {
                  const next = vertices[(idx + 1) % vertices.length];
                  const mid: [number, number] = [(xy[0] + next[0]) / 2, (xy[1] + next[1]) / 2];
                  return (
                    <CircleMarker
                      key={`mid-${idx}`}
                      center={[mid[1], mid[0]]}
                      radius={4}
                      pathOptions={{ color: "#1d4ed8", fillColor: "#1d4ed8", fillOpacity: 0.7 }}
                      eventHandlers={{
                        click: () => {
                          const nextDraft = [...vertices];
                          nextDraft.splice(idx + 1, 0, mid);
                          setEditBoundaryDraft(nextDraft);
                        },
                      }}
                    />
                  );
                })}
              </>
            );
          })()}

          {drawBoundaryDraft.map((xy, idx) => (
            <CircleMarker
              key={`draft-${idx}`}
              center={[xy[1], xy[0]]}
              radius={4}
              pathOptions={{ color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 0.9 }}
            />
          ))}
          {drawBoundaryDraft.length >= 2 && (
            <Polyline
              positions={drawBoundaryDraft.map((xy) => [xy[1], xy[0]] as [number, number])}
              pathOptions={{ color: "#f59e0b", weight: 2, dashArray: "6 4" }}
            />
          )}
          {drawBoundaryDraft.length >= 3 && (
            <Polygon
              positions={drawBoundaryDraft.map((xy) => [xy[1], xy[0]] as [number, number])}
              pathOptions={{ color: "#f59e0b", weight: 2, dashArray: "6 4", fillOpacity: 0.08 }}
            />
          )}
        </FeatureGroup>
        <FitOnRefresh bounds={bounds} refreshVersion={viewportRefreshVersion} />
      </MapContainer>
    </div>
  );
}

