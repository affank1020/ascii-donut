import type { Matrix3, Quaternion, Vector3 } from "./types";

const EPSILON = 1e-8;

export const IDENTITY_QUATERNION: Quaternion = { w: 1, x: 0, y: 0, z: 0 };

export function quaternionFromAxisAngle(axis: Vector3, angle: number): Quaternion {
  const halfAngle = angle / 2;
  const scale = Math.sin(halfAngle);
  return normalizeQuaternion({
    w: Math.cos(halfAngle),
    x: axis.x * scale,
    y: axis.y * scale,
    z: axis.z * scale,
  });
}

export function quaternionFromUnitVectors(from: Vector3, to: Vector3): Quaternion {
  const dot = from.x * to.x + from.y * to.y + from.z * to.z;

  if (dot < -1 + EPSILON) {
    const axis = Math.abs(from.x) > Math.abs(from.z)
      ? normalizeVector({ x: -from.y, y: from.x, z: 0 })
      : normalizeVector({ x: 0, y: -from.z, z: from.y });
    return quaternionFromAxisAngle(axis, Math.PI);
  }

  return normalizeQuaternion({
    w: 1 + dot,
    x: from.y * to.z - from.z * to.y,
    y: from.z * to.x - from.x * to.z,
    z: from.x * to.y - from.y * to.x,
  });
}

export function multiplyQuaternions(left: Quaternion, right: Quaternion): Quaternion {
  return {
    w: left.w * right.w - left.x * right.x - left.y * right.y - left.z * right.z,
    x: left.w * right.x + left.x * right.w + left.y * right.z - left.z * right.y,
    y: left.w * right.y - left.x * right.z + left.y * right.w + left.z * right.x,
    z: left.w * right.z + left.x * right.y - left.y * right.x + left.z * right.w,
  };
}

export function normalizeQuaternion(value: Quaternion): Quaternion {
  const magnitude = Math.hypot(value.w, value.x, value.y, value.z);
  if (magnitude < EPSILON) return IDENTITY_QUATERNION;
  return {
    w: value.w / magnitude,
    x: value.x / magnitude,
    y: value.y / magnitude,
    z: value.z / magnitude,
  };
}

export function quaternionToAxisAngle(value: Quaternion): { axis: Vector3; angle: number } {
  const normalized = normalizeQuaternion(value);
  const signed = normalized.w < 0
    ? { w: -normalized.w, x: -normalized.x, y: -normalized.y, z: -normalized.z }
    : normalized;
  const angle = 2 * Math.acos(Math.min(1, signed.w));
  const scale = Math.sqrt(Math.max(0, 1 - signed.w * signed.w));
  if (scale < EPSILON) return { axis: { x: 1, y: 0, z: 0 }, angle: 0 };
  return {
    axis: { x: signed.x / scale, y: signed.y / scale, z: signed.z / scale },
    angle,
  };
}

export function quaternionToMatrix(value: Quaternion): Matrix3 {
  const { w, x, y, z } = normalizeQuaternion(value);
  return [
    1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w),
    2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w),
    2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y),
  ];
}

function normalizeVector(value: Vector3): Vector3 {
  const magnitude = Math.hypot(value.x, value.y, value.z);
  if (magnitude < EPSILON) return { x: 1, y: 0, z: 0 };
  return { x: value.x / magnitude, y: value.y / magnitude, z: value.z / magnitude };
}
