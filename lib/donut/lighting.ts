import type { Vector3 } from "./types";

export const ASCII_RAMP = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

const LIGHT_DIRECTION: Vector3 = {
  x: 0,
  y: Math.SQRT1_2,
  z: -Math.SQRT1_2,
};

/** The dot product of normal and light vectors. */
export function diffuseLight(normal: Vector3): number {
  return (
    normal.x * LIGHT_DIRECTION.x +
    normal.y * LIGHT_DIRECTION.y +
    normal.z * LIGHT_DIRECTION.z
  );
}

export function lightToGlyph(light: number, ramp = ASCII_RAMP): string {
  const normalized = Math.max(0, Math.min(1, (light + 0.2) / 1.2));
  const index = Math.floor(normalized * (ramp.length - 1));
  return ramp[index];
}
