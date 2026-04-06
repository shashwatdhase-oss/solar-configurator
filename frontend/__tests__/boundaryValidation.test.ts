import { validateBoundaryCoordinates } from "@/lib/geometry/utils";

test("rejects self-intersection", () => {
  const err = validateBoundaryCoordinates([
    [0, 0],
    [2, 2],
    [2, 0],
    [0, 2],
  ]);
  expect(err).toMatch(/self-intersect/);
});

test("accepts valid rectangle", () => {
  const err = validateBoundaryCoordinates([
    [0, 0],
    [3, 0],
    [3, 2],
    [0, 2],
  ]);
  expect(err).toBeNull();
});

