import { ChoiceGroup } from "./ChoiceGroup";
import { ColourControl } from "./ColourControl";
import type { RotationAxis, ShapeName } from "@/lib/donut/types";

export type Direction = "clockwise" | "anticlockwise";

type ControlTrayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  axes: RotationAxis[];
  onAxisSelect: (axis: RotationAxis) => void;
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
  color: string;
  hex: string;
  onColorChange: (value: string) => void;
  onHexChange: (value: string) => void;
  shape: ShapeName;
  onShapeChange: (shape: ShapeName) => void;
};

const AXES = [
  { value: "x", label: "X" },
  { value: "y", label: "Y" },
  { value: "z", label: "Z" },
] as const;
const DIRECTIONS = [
  { value: "clockwise", label: "Clockwise" },
  { value: "anticlockwise", label: "Anticlockwise" },
] as const;
const SHAPES = [
  { value: "donut", label: "Donut" },
  { value: "cube", label: "Cube" },
  { value: "pyramid", label: "Pyramid" },
] as const;

export function ControlTray(props: ControlTrayProps) {
  return (
    <section
      className={`tray ${props.open ? "is-open" : ""}`}
      data-controls
      aria-label="Shape controls"
    >
      <button
        className="tray-handle"
        type="button"
        onClick={() => props.onOpenChange(!props.open)}
        aria-expanded={props.open}
      >
        Controls
      </button>

      <div className="tray-content">
        <ChoiceGroup
          label="Rotation"
          options={AXES}
          selected={props.axes}
          onSelect={(value) => props.onAxisSelect(value as RotationAxis)}
        />
        <ChoiceGroup
          label="Direction"
          options={DIRECTIONS}
          selected={[props.direction]}
          onSelect={(value) => props.onDirectionChange(value as Direction)}
          className="direction-options"
        />
        <ColourControl
          color={props.color}
          hex={props.hex}
          onColorChange={props.onColorChange}
          onHexChange={props.onHexChange}
        />
        <ChoiceGroup
          label="Shape"
          options={SHAPES}
          selected={[props.shape]}
          onSelect={(value) => props.onShapeChange(value as ShapeName)}
        />
      </div>
    </section>
  );
}
