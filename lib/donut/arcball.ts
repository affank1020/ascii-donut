import {
  multiplyQuaternions,
  normalizeQuaternion,
  quaternionFromAxisAngle,
  quaternionFromUnitVectors,
  quaternionToAxisAngle,
  quaternionToMatrix,
} from "./quaternion";
import type { Matrix3, Quaternion, RotationAxis, Vector3 } from "./types";

export type PointerPosition = Readonly<{ x: number; y: number }>;
export type ViewportBounds = Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
}>;

const AXIS_VECTORS: Record<RotationAxis, Vector3> = {
  x: { x: 1, y: 0, z: 0 },
  y: { x: 0, y: 1, z: 0 },
  z: { x: 0, y: 0, z: 1 },
};
const AUTO_SPEED: Record<RotationAxis, number> = { x: 0.55, y: 1.1, z: 0.72 };
const DRAG_SENSITIVITY = 2.2;

export class ArcballController {
  private orientation: Quaternion = quaternionFromAxisAngle(AXIS_VECTORS.x, 0.58);
  private angularVelocity: Vector3 = { x: 0, y: 0, z: 0 };
  private previousVector: Vector3 | null = null;
  private previousTime = 0;
  private interacting = false;

  begin(pointer: PointerPosition, bounds: ViewportBounds, time: number) {
    this.interacting = true;
    this.angularVelocity = { x: 0, y: 0, z: 0 };
    this.previousVector = projectToArcball(pointer, bounds);
    this.previousTime = time;
  }

  drag(pointer: PointerPosition, bounds: ViewportBounds, time: number) {
    if (!this.previousVector) {
      this.begin(pointer, bounds, time);
      return;
    }

    const nextVector = projectToArcball(pointer, bounds);
    const pointerDelta = quaternionFromUnitVectors(nextVector, this.previousVector);
    const pointerRotation = quaternionToAxisAngle(pointerDelta);
    const delta = quaternionFromAxisAngle(
      pointerRotation.axis,
      pointerRotation.angle * DRAG_SENSITIVITY,
    );
    this.orientation = normalizeQuaternion(multiplyQuaternions(delta, this.orientation));

    const elapsed = Math.min(0.05, Math.max(0.008, (time - this.previousTime) / 1000));
    const { axis, angle } = quaternionToAxisAngle(delta);
    const instant = {
      x: axis.x * angle / elapsed,
      y: axis.y * angle / elapsed,
      z: axis.z * angle / elapsed,
    };
    this.angularVelocity = {
      x: this.angularVelocity.x * 0.35 + instant.x * 0.65,
      y: this.angularVelocity.y * 0.35 + instant.y * 0.65,
      z: this.angularVelocity.z * 0.35 + instant.z * 0.65,
    };
    this.previousVector = nextVector;
    this.previousTime = time;
  }

  hold() {
    this.interacting = true;
    this.previousVector = null;
    this.angularVelocity = { x: 0, y: 0, z: 0 };
  }

  release() {
    this.interacting = false;
    this.previousVector = null;
  }

  cancel() {
    this.release();
    this.angularVelocity = { x: 0, y: 0, z: 0 };
  }

  step(deltaTime: number, axes: RotationAxis[], direction: number) {
    if (this.interacting) return;

    const momentum = Math.hypot(
      this.angularVelocity.x,
      this.angularVelocity.y,
      this.angularVelocity.z,
    );

    if (momentum > 0.025) {
      const axis = {
        x: this.angularVelocity.x / momentum,
        y: this.angularVelocity.y / momentum,
        z: this.angularVelocity.z / momentum,
      };
      this.rotate(axis, momentum * deltaTime);
      const drag = Math.exp(-3.4 * deltaTime);
      this.angularVelocity = {
        x: this.angularVelocity.x * drag,
        y: this.angularVelocity.y * drag,
        z: this.angularVelocity.z * drag,
      };
      return;
    }

    this.angularVelocity = { x: 0, y: 0, z: 0 };
    for (const axis of axes) {
      this.rotate(AXIS_VECTORS[axis], AUTO_SPEED[axis] * direction * deltaTime);
    }
  }

  matrix(): Matrix3 {
    return quaternionToMatrix(this.orientation);
  }

  private rotate(axis: Vector3, angle: number) {
    const delta = quaternionFromAxisAngle(axis, angle);
    this.orientation = normalizeQuaternion(multiplyQuaternions(delta, this.orientation));
  }
}

function projectToArcball(pointer: PointerPosition, bounds: ViewportBounds): Vector3 {
  const radius = Math.max(1, Math.min(bounds.width, bounds.height) * 0.46);
  let x = (pointer.x - bounds.left - bounds.width / 2) / radius;
  let y = -(pointer.y - bounds.top - bounds.height / 2) / radius;
  const squaredLength = x * x + y * y;

  if (squaredLength <= 1) return { x, y, z: Math.sqrt(1 - squaredLength) };

  const scale = 1 / Math.sqrt(squaredLength);
  x *= scale;
  y *= scale;
  return { x, y, z: 0 };
}
