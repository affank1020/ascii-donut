import { describe, expect, it } from "vitest";
import { ASCII_RAMP, diffuseLight, lightToGlyph } from "./lighting";
import { projectPoint } from "./projection";
import { IDENTITY_QUATERNION, quaternionToMatrix } from "./quaternion";
import { renderShapeFrame } from "./render";
import type { ShapeName } from "./types";

describe("lighting", () => {
  it("maps light values to the bounds of the character ramp", () => {
    expect(lightToGlyph(-100)).toBe(ASCII_RAMP[0]);
    expect(lightToGlyph(100)).toBe(ASCII_RAMP.at(-1));
  });

  it("returns the expected diffuse light for the fixed light direction", () => {
    expect(diffuseLight({ x: 0, y: Math.SQRT1_2, z: -Math.SQRT1_2 })).toBeCloseTo(1);
    expect(diffuseLight({ x: 1, y: 0, z: 0 })).toBe(0);
  });
});

describe("perspective projection", () => {
  const frame = { columns: 80, rows: 40 };

  it("projects the origin to the middle of the frame", () => {
    expect(projectPoint({ x: 0, y: 0, z: 0 }, frame)).toMatchObject({
      column: 40,
      row: 20,
    });
  });

  it("rejects points behind the camera or outside the frame", () => {
    expect(projectPoint({ x: 0, y: 0, z: -7 }, frame)).toBeNull();
    expect(projectPoint({ x: 100, y: 0, z: 0 }, frame)).toBeNull();
  });
});

describe("ASCII frame rendering", () => {
  const frameSize = { columns: 48, rows: 24 };
  const shapes: ShapeName[] = ["donut", "cube", "pyramid"];

  it.each(shapes)("renders a correctly sized, non-empty %s frame", (shape) => {
    const frame = renderShapeFrame(
      shape,
      quaternionToMatrix(IDENTITY_QUATERNION),
      frameSize,
    );
    const rows = frame.split("\n");

    expect(rows).toHaveLength(frameSize.rows);
    expect(rows.every((row) => row.length === frameSize.columns)).toBe(true);
    expect(frame.trim().length).toBeGreaterThan(0);
  });
});
