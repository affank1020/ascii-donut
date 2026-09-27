import type { ShapeName } from "@/lib/donut/types";

type AsciiObjectProps = {
  frame: string;
  shape: ShapeName;
  color: string;
  zoom: number;
  pan: Readonly<{ x: number; y: number }>;
};

export function AsciiObject({ frame, shape, color, zoom, pan }: AsciiObjectProps) {
  return (
    <div className="object-origin">
      <pre
        className="ascii-shape"
        style={{
          color,
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
        }}
        aria-hidden="true"
      >
        {frame}
      </pre>
      <span className="sr-only">
        An interactive rotating ASCII {shape}. Drag to rotate, use two fingers to pan, and
        scroll or pinch to zoom.
      </span>
    </div>
  );
}
