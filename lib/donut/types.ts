export type Vector3 = Readonly<{
  x: number;
  y: number;
  z: number;
}>;

export type Matrix3 = readonly [
  number, number, number,
  number, number, number,
  number, number, number,
];

export type Quaternion = Readonly<{
  w: number;
  x: number;
  y: number;
  z: number;
}>;

export type SurfacePoint = Readonly<{
  position: Vector3;
  normal: Vector3;
}>;

export type FrameSize = Readonly<{
  columns: number;
  rows: number;
}>;

export type ProjectedPoint = Readonly<{
  column: number;
  row: number;
  inverseDepth: number;
}>;

export type RotationAxis = "x" | "y" | "z";
export type ShapeName = "donut" | "cube" | "pyramid";
