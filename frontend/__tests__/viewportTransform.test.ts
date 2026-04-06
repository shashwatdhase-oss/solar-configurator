import { createViewportTransform, screenToWorld, worldToScreen } from "@/lib/geometry/utils";

test("screen/world transform roundtrip", () => {
  const transform = createViewportTransform(
    { minX: 72, minY: 26, maxX: 73, maxY: 27 },
    1200,
    800,
  );

  const world: [number, number] = [72.4, 26.6];
  const screen = worldToScreen(world, transform, 800);
  const back = screenToWorld(screen, transform, 800);

  expect(back[0]).toBeCloseTo(world[0], 5);
  expect(back[1]).toBeCloseTo(world[1], 5);
});

