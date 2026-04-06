import {
  buildBoundaryGeometry,
  createViewportTransform,
  getFeatureBounds,
  validateBoundaryCoordinates,
  worldToScreen,
} from "@/lib/geometry/utils";
import type { Feature } from "@/lib/types/entities";

const features: Feature[] = [
  {
    id: 1,
    project_id: 1,
    layer_id: 1,
    feature_type: "boundary",
    geometry: {
      type: "Polygon",
      coordinates: [[[72.1, 26.1], [72.2, 26.1], [72.2, 26.2], [72.1, 26.2], [72.1, 26.1]]],
    },
    properties: {},
    is_active: true,
  },
];

test("computes feature bounds", () => {
  const bounds = getFeatureBounds(features);
  expect(bounds?.minX).toBe(72.1);
  expect(bounds?.maxY).toBe(26.2);
});

test("boundary validation catches low vertices", () => {
  const error = validateBoundaryCoordinates([[72.1, 26.1], [72.2, 26.2]]);
  expect(error).toMatch(/at least 3 vertices/);
});

test("viewport transform maps world point", () => {
  const bounds = getFeatureBounds(features);
  if (!bounds) throw new Error("bounds missing");
  const transform = createViewportTransform(bounds, 1000, 700);
  const point = worldToScreen([72.1, 26.1], transform, 700);
  expect(point.x).toBeGreaterThanOrEqual(0);
  expect(point.y).toBeLessThanOrEqual(700);
});

test("buildBoundaryGeometry closes ring", () => {
  const geo = buildBoundaryGeometry([
    [72.1, 26.1],
    [72.2, 26.1],
    [72.2, 26.2],
  ]);
  const ring = geo.coordinates as [number, number][][];
  expect(ring[0][0]).toEqual(ring[0][ring[0].length - 1]);
});

