import { diffuseLight, lightToGlyph } from "./lighting";
import { transformVector } from "./matrix";
import { projectPoint } from "./projection";
import { visitShapeSurface } from "./shape";
import type { FrameSize, Matrix3, ShapeName } from "./types";

export function renderShapeFrame(
  shape: ShapeName,
  rotation: Matrix3,
  frame: FrameSize,
): string {
  const glyphs = new Array<string>(frame.columns * frame.rows).fill(" ");
  const depthBuffer = new Float32Array(frame.columns * frame.rows);
  visitShapeSurface(shape, (surfacePoint) => {
    const position = transformVector(rotation, surfacePoint.position);
    const projected = projectPoint(position, frame);
    if (!projected) return;

    const bufferIndex = projected.column + projected.row * frame.columns;
    if (projected.inverseDepth <= depthBuffer[bufferIndex]) return;

    const normal = transformVector(rotation, surfacePoint.normal);
    depthBuffer[bufferIndex] = projected.inverseDepth;
    glyphs[bufferIndex] = lightToGlyph(diffuseLight(normal));
  });

  return rowsToString(glyphs, frame);
}

function rowsToString(glyphs: string[], frame: FrameSize): string {
  const rows: string[] = [];
  for (let row = 0; row < frame.rows; row++) {
    const start = row * frame.columns;
    rows.push(glyphs.slice(start, start + frame.columns).join(""));
  }
  return rows.join("\n");
}
