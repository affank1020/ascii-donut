import { describe, expect, it } from "vitest";
import { transformVector } from "./matrix";
import {
  IDENTITY_QUATERNION,
  multiplyQuaternions,
  quaternionFromAxisAngle,
  quaternionFromUnitVectors,
  quaternionToMatrix,
} from "./quaternion";

const closeToVector = (
  value: Readonly<{ x: number; y: number; z: number }>,
  expected: Readonly<{ x: number; y: number; z: number }>,
) => {
  expect(value.x).toBeCloseTo(expected.x, 8);
  expect(value.y).toBeCloseTo(expected.y, 8);
  expect(value.z).toBeCloseTo(expected.z, 8);
};

describe("quaternion rotations", () => {
  it("keeps vectors unchanged for the identity rotation", () => {
    const vector = { x: 2, y: -1, z: 4 };
    closeToVector(transformVector(quaternionToMatrix(IDENTITY_QUATERNION), vector), vector);
  });

  it("rotates a vector by 90 degrees around the z axis", () => {
    const rotation = quaternionFromAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI / 2);
    closeToVector(
      transformVector(quaternionToMatrix(rotation), { x: 1, y: 0, z: 0 }),
      { x: 0, y: 1, z: 0 },
    );
  });

  it("finds the shortest rotation between two unit vectors", () => {
    const rotation = quaternionFromUnitVectors(
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    );
    closeToVector(
      transformVector(quaternionToMatrix(rotation), { x: 1, y: 0, z: 0 }),
      { x: 0, y: 1, z: 0 },
    );
  });

  it("composes rotations without changing their normalized scale", () => {
    const xRotation = quaternionFromAxisAngle({ x: 1, y: 0, z: 0 }, 0.4);
    const yRotation = quaternionFromAxisAngle({ x: 0, y: 1, z: 0 }, 0.7);
    const composed = multiplyQuaternions(yRotation, xRotation);
    expect(Math.hypot(composed.w, composed.x, composed.y, composed.z)).toBeCloseTo(1, 8);
  });
});
