"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AsciiObject } from "@/components/AsciiObject";
import { InfoPopover } from "@/components/InfoPopover";
import { ControlTray, type Direction } from "@/components/controls/ControlTray";
import { ArcballController, type PointerPosition } from "@/lib/donut/arcball";
import { renderShapeFrame } from "@/lib/donut/render";
import type { FrameSize, RotationAxis, ShapeName } from "@/lib/donut/types";

const DESKTOP_SIZE: FrameSize = { columns: 104, rows: 52 };

function sizeForViewport(width: number): FrameSize {
  if (width < 520) return { columns: 64, rows: 38 };
  if (width < 900) return { columns: 82, rows: 44 };
  return DESKTOP_SIZE;
}

function clampZoom(value: number): number {
  return Math.min(2.5, Math.max(0.5, value));
}

function distance(a: PointerPosition, b: PointerPosition): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: PointerPosition, b: PointerPosition): PointerPosition {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function contrastColor(hex: string): string {
  const channels = hex.match(/[0-9a-f]{2}/gi)?.map((channel) => Number.parseInt(channel, 16));
  if (!channels || channels.length !== 3) return "#08090b";
  const luminance = (channels[0] * 299 + channels[1] * 587 + channels[2] * 114) / 1000;
  return luminance > 145 ? "#08090b" : "#ffffff";
}

export default function Home() {
  const [frame, setFrame] = useState("");
  const [size, setSize] = useState<FrameSize>(DESKTOP_SIZE);
  const [shape, setShape] = useState<ShapeName>("donut");
  const [axes, setAxes] = useState<RotationAxis[]>(["x", "y"]);
  const [direction, setDirection] = useState<Direction>("clockwise");
  const [color, setColor] = useState("#f4f7ff");
  const [hex, setHex] = useState("#F4F7FF");
  const [trayOpen, setTrayOpen] = useState(false);
  const [zoom, setZoom] = useState(0.9);
  const [pan, setPan] = useState<PointerPosition>({ x: 0, y: 0 });

  const arcball = useRef(new ArcballController());
  const pointers = useRef(new Map<number, PointerPosition>());
  const pinch = useRef<{ distance: number; midpoint: PointerPosition } | null>(null);

  useEffect(() => {
    const fitToViewport = () => setSize(sizeForViewport(window.innerWidth));
    fitToViewport();
    window.addEventListener("resize", fitToViewport);
    return () => window.removeEventListener("resize", fitToViewport);
  }, []);

  useEffect(() => {
    let animationFrame = 0;
    let previousRender = 0;
    let previousTick = performance.now();
    const sign = direction === "clockwise" ? 1 : -1;

    const animate = (time: number) => {
      const deltaTime = Math.min(0.05, (time - previousTick) / 1000);
      previousTick = time;
      arcball.current.step(deltaTime, axes, sign);

      if (time - previousRender >= 32) {
        setFrame(renderShapeFrame(shape, arcball.current.matrix(), size));
        previousRender = time;
      }
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [axes, direction, shape, size]);

  const toggleAxis = (axis: RotationAxis) => {
    setAxes((current) =>
      current.includes(axis)
        ? current.filter((item) => item !== axis)
        : [...current, axis],
    );
  };

  const changeColor = (value: string) => {
    setColor(value);
    setHex(value.toUpperCase());
  };

  const updateHex = (value: string) => {
    const next = value.startsWith("#") ? value : `#${value}`;
    setHex(next.toUpperCase());
    if (/^#[0-9A-Fa-f]{6}$/.test(next)) setColor(next);
  };

  const pointerPair = (): [PointerPosition, PointerPosition] | null => {
    const values = [...pointers.current.values()];
    return values.length >= 2 ? [values[0], values[1]] : null;
  };

  const sceneStyle = {
    "--accent-color": color,
    "--accent-contrast": contrastColor(color),
  } as CSSProperties;

  return (
    <main
      className="scene"
      style={sceneStyle}
      onWheel={(event) => {
        if ((event.target as HTMLElement).closest("[data-controls]")) return;
        event.preventDefault();
        setZoom((current) => clampZoom(current * Math.exp(-event.deltaY * 0.0012)));
      }}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("[data-controls]")) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        const current = { x: event.clientX, y: event.clientY };
        pointers.current.set(event.pointerId, current);
        const pair = pointerPair();

        if (pair) {
          arcball.current.hold();
          pinch.current = { distance: distance(...pair), midpoint: midpoint(...pair) };
        } else {
          arcball.current.begin(current, event.currentTarget.getBoundingClientRect(), event.timeStamp);
        }
      }}
      onPointerMove={(event) => {
        if (!pointers.current.has(event.pointerId)) return;
        const current = { x: event.clientX, y: event.clientY };
        pointers.current.set(event.pointerId, current);
        const pair = pointerPair();

        if (pair && pinch.current) {
          const nextDistance = distance(...pair);
          const nextMidpoint = midpoint(...pair);
          setZoom((value) => clampZoom(value * (nextDistance / pinch.current!.distance)));
          setPan((value) => ({
            x: value.x + nextMidpoint.x - pinch.current!.midpoint.x,
            y: value.y + nextMidpoint.y - pinch.current!.midpoint.y,
          }));
          pinch.current = { distance: nextDistance, midpoint: nextMidpoint };
        } else if (pointers.current.size === 1) {
          arcball.current.drag(
            current,
            event.currentTarget.getBoundingClientRect(),
            event.timeStamp,
          );
        }
      }}
      onPointerUp={(event) => {
        pointers.current.delete(event.pointerId);
        pinch.current = null;
        const remaining = [...pointers.current.values()][0];
        if (remaining) {
          arcball.current.begin(
            remaining,
            event.currentTarget.getBoundingClientRect(),
            event.timeStamp,
          );
        } else {
          arcball.current.release();
        }
      }}
      onPointerCancel={(event) => {
        pointers.current.delete(event.pointerId);
        pinch.current = null;
        arcball.current.cancel();
      }}
    >
      <AsciiObject frame={frame} shape={shape} color={color} zoom={zoom} pan={pan} />
      <InfoPopover />
      <ControlTray
        open={trayOpen}
        onOpenChange={setTrayOpen}
        axes={axes}
        onAxisSelect={toggleAxis}
        direction={direction}
        onDirectionChange={setDirection}
        color={color}
        hex={hex}
        onColorChange={changeColor}
        onHexChange={updateHex}
        shape={shape}
        onShapeChange={setShape}
      />
    </main>
  );
}
