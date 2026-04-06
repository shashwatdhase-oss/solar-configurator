import type { Feature, Geometry } from "@/lib/types/entities";

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ViewportTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export function flattenCoordinates(geometry: Geometry): number[][] {
  const { type, coordinates } = geometry;

  if (type === "Point") return [coordinates as number[]];
  if (type === "LineString" || type === "MultiPoint") return coordinates as number[][];

  if (type === "Polygon" || type === "MultiLineString") {
    return (coordinates as number[][][]).flat();
  }

  if (type === "MultiPolygon") {
    return (coordinates as number[][][][]).flat(2);
  }

  return [];
}

export function getFeatureBounds(features: Feature[]): Bounds | null {
  const all = features.flatMap((f) => flattenCoordinates(f.geometry));
  if (all.length === 0) return null;

  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

export function createViewportTransform(
  bounds: Bounds,
  width: number,
  height: number,
  padding = 24,
): ViewportTransform {
  const spanX = Math.max(bounds.maxX - bounds.minX, 1e-8);
  const spanY = Math.max(bounds.maxY - bounds.minY, 1e-8);

  const scaleX = (width - padding * 2) / spanX;
  const scaleY = (height - padding * 2) / spanY;
  const scale = Math.max(Math.min(scaleX, scaleY), 1);

  const offsetX = padding - bounds.minX * scale;
  const offsetY = padding - bounds.minY * scale;

  return { scale, offsetX, offsetY };
}

// Frontend rendering assumes WGS84 lon/lat. Metric calculations should happen in backend/services.
export function worldToScreen(coord: [number, number], transform: ViewportTransform, height: number): Point2D {
  const [x, y] = coord;
  return {
    x: x * transform.scale + transform.offsetX,
    y: height - (y * transform.scale + transform.offsetY),
  };
}

export function screenToWorld(point: Point2D, transform: ViewportTransform, height: number): [number, number] {
  const x = (point.x - transform.offsetX) / transform.scale;
  const y = ((height - point.y) - transform.offsetY) / transform.scale;
  return [x, y];
}

export function polygonArea(coords: [number, number][]): number {
  let area = 0;
  for (let i = 0; i < coords.length - 1; i += 1) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

export function segmentsIntersect(a1: [number, number], a2: [number, number], b1: [number, number], b2: [number, number]): boolean {
  const cross = (p1: [number, number], p2: [number, number], p3: [number, number]) =>
    (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);

  const d1 = cross(a1, a2, b1);
  const d2 = cross(a1, a2, b2);
  const d3 = cross(b1, b2, a1);
  const d4 = cross(b1, b2, a2);

  return d1 * d2 < 0 && d3 * d4 < 0;
}

export function hasSelfIntersection(coords: [number, number][]): boolean {
  for (let i = 0; i < coords.length - 1; i += 1) {
    for (let j = i + 2; j < coords.length - 1; j += 1) {
      if (i === 0 && j === coords.length - 2) continue;
      if (segmentsIntersect(coords[i], coords[i + 1], coords[j], coords[j + 1])) return true;
    }
  }
  return false;
}

export function validateBoundaryCoordinates(rawCoords: [number, number][]): string | null {
  if (rawCoords.length < 3) return "Boundary requires at least 3 vertices";
  const closed = closeRing(rawCoords);
  if (polygonArea(closed) <= 0) return "Boundary area must be non-zero";
  if (hasSelfIntersection(closed)) return "Boundary cannot self-intersect";
  return null;
}

export function closeRing(coords: [number, number][]): [number, number][] {
  if (coords.length === 0) return [];
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return coords;
  return [...coords, first];
}

export function buildBoundaryGeometry(coords: [number, number][]): Geometry {
  return {
    type: "Polygon",
    coordinates: [closeRing(coords)],
  };
}

export function polygonAreaSqM(coords: [number, number][]): number {
  const closed = closeRing(coords);
  if (closed.length < 4) return 0;

  // Approximate WGS84 polygon area in square meters by projecting to a local tangent plane
  // around the polygon centroid. This keeps metric math isolated in the geometry utility layer.
  const centroidLat =
    closed.slice(0, -1).reduce((sum, [, lat]) => sum + lat, 0) / Math.max(closed.length - 1, 1);
  const centroidLon =
    closed.slice(0, -1).reduce((sum, [lon]) => sum + lon, 0) / Math.max(closed.length - 1, 1);

  const latScale = 111_320;
  const lonScale = 111_320 * Math.cos((centroidLat * Math.PI) / 180);

  let area = 0;
  for (let i = 0; i < closed.length - 1; i += 1) {
    const [lon1, lat1] = closed[i];
    const [lon2, lat2] = closed[i + 1];
    const x1 = (lon1 - centroidLon) * lonScale;
    const y1 = (lat1 - centroidLat) * latScale;
    const x2 = (lon2 - centroidLon) * lonScale;
    const y2 = (lat2 - centroidLat) * latScale;
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area / 2);
}

export function featureAreaSqM(feature: Feature | null): number {
  if (!feature || feature.geometry.type !== "Polygon") return 0;
  const ring = feature.geometry.coordinates as [number, number][][];
  return polygonAreaSqM(ring[0] ?? []);
}

