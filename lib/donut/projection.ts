import type { FrameSize, ProjectedPoint, Vector3 } from "./types";

// Extra camera distance keeps every supported shape inside the character buffer
// at all orientations. CSS zoom can still take the object beyond the viewport.
const CAMERA_DISTANCE = 6.25;
const HORIZONTAL_SCALE = 0.7;
const VERTICAL_SCALE = 0.62;

export function projectPoint(point: Vector3, frame: FrameSize): ProjectedPoint | null {
  const depth = point.z + CAMERA_DISTANCE;
  if (depth <= 0) return null;

  const inverseDepth = 1 / depth;
  const column = Math.floor(
    frame.columns / 2 + frame.columns * HORIZONTAL_SCALE * inverseDepth * point.x,
  );
  const row = Math.floor(
    frame.rows / 2 - frame.rows * VERTICAL_SCALE * inverseDepth * point.y,
  );

  if (column < 0 || column >= frame.columns || row < 0 || row >= frame.rows) {
    return null;
  }

  return { column, row, inverseDepth };
}
