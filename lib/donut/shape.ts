import type { ShapeName, SurfacePoint, Vector3 } from "./types";

type PointVisitor = (point: SurfacePoint) => void;

const FULL_TURN = Math.PI * 2;

export function visitShapeSurface(shape: ShapeName, visit: PointVisitor): void {
  if (shape === "cube") return visitCubeSurface(visit);
  if (shape === "pyramid") return visitPyramidSurface(visit);
  visitTorusSurface(visit);
}

/** The parametric equation for one point on a torus. */
export function getTorusPoint(theta: number, phi: number): SurfacePoint {
  const majorRadius = 2.15;
  const minorRadius = 1;
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const ringRadius = majorRadius + minorRadius * cosTheta;

  return {
    position: {
      x: ringRadius * cosPhi,
      y: minorRadius * sinTheta,
      z: ringRadius * sinPhi,
    },
    normal: { x: cosTheta * cosPhi, y: sinTheta, z: cosTheta * sinPhi },
  };
}

function visitTorusSurface(visit: PointVisitor): void {
  for (let theta = 0; theta < FULL_TURN; theta += 0.035) {
    for (let phi = 0; phi < FULL_TURN; phi += 0.012) {
      visit(getTorusPoint(theta, phi));
    }
  }
}

function visitCubeSurface(visit: PointVisitor): void {
  const half = 1.65;
  const steps = 44;

  for (let row = 0; row <= steps; row++) {
    const u = -half + (row / steps) * half * 2;
    for (let column = 0; column <= steps; column++) {
      const v = -half + (column / steps) * half * 2;
      visit({ position: { x: half, y: u, z: v }, normal: { x: 1, y: 0, z: 0 } });
      visit({ position: { x: -half, y: u, z: v }, normal: { x: -1, y: 0, z: 0 } });
      visit({ position: { x: u, y: half, z: v }, normal: { x: 0, y: 1, z: 0 } });
      visit({ position: { x: u, y: -half, z: v }, normal: { x: 0, y: -1, z: 0 } });
      visit({ position: { x: u, y: v, z: half }, normal: { x: 0, y: 0, z: 1 } });
      visit({ position: { x: u, y: v, z: -half }, normal: { x: 0, y: 0, z: -1 } });
    }
  }
}

function visitPyramidSurface(visit: PointVisitor): void {
  const half = 1.7;
  const baseY = 1.45;
  const apex: Vector3 = { x: 0, y: -1.8, z: 0 };
  const frontLeft: Vector3 = { x: -half, y: baseY, z: half };
  const frontRight: Vector3 = { x: half, y: baseY, z: half };
  const backRight: Vector3 = { x: half, y: baseY, z: -half };
  const backLeft: Vector3 = { x: -half, y: baseY, z: -half };

  visitTriangle(apex, frontRight, frontLeft, visit);
  visitTriangle(apex, backRight, frontRight, visit);
  visitTriangle(apex, backLeft, backRight, visit);
  visitTriangle(apex, frontLeft, backLeft, visit);

  const steps = 42;
  for (let row = 0; row <= steps; row++) {
    const x = -half + (row / steps) * half * 2;
    for (let column = 0; column <= steps; column++) {
      const z = -half + (column / steps) * half * 2;
      visit({ position: { x, y: baseY, z }, normal: { x: 0, y: 1, z: 0 } });
    }
  }
}

function visitTriangle(a: Vector3, b: Vector3, c: Vector3, visit: PointVisitor): void {
  const steps = 42;
  const normal = triangleNormal(a, b, c);

  for (let row = 0; row <= steps; row++) {
    const u = row / steps;
    for (let column = 0; column <= steps - row; column++) {
      const v = column / steps;
      visit({
        position: {
          x: a.x + u * (b.x - a.x) + v * (c.x - a.x),
          y: a.y + u * (b.y - a.y) + v * (c.y - a.y),
          z: a.z + u * (b.z - a.z) + v * (c.z - a.z),
        },
        normal,
      });
    }
  }
}

function triangleNormal(a: Vector3, b: Vector3, c: Vector3): Vector3 {
  const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const ac = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
  const cross = {
    x: ab.y * ac.z - ab.z * ac.y,
    y: ab.z * ac.x - ab.x * ac.z,
    z: ab.x * ac.y - ab.y * ac.x,
  };
  const length = Math.hypot(cross.x, cross.y, cross.z);
  return { x: cross.x / length, y: cross.y / length, z: cross.z / length };
}
