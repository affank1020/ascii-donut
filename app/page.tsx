"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CircleDot,
  Dices,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

type Shape = "torus" | "sphere" | "cube" | "mobius";
type Settings = {
  shape: Shape;
  speedX: number;
  speedY: number;
  tilt: number;
  density: number;
  scale: number;
  tube: number;
  light: number;
  ramp: string;
  color: string;
  invert: boolean;
  grid: boolean;
};

type Point = {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
};

const DEFAULTS: Settings = {
  shape: "torus",
  speedX: 0.35,
  speedY: 0.72,
  tilt: 18,
  density: 36,
  scale: 1,
  tube: 0.68,
  light: 32,
  ramp: " .·-:=+*#%@",
  color: "#2348ff",
  invert: false,
  grid: true,
};

const SHAPE_LABELS: Record<Shape, string> = {
  torus: "Classic torus",
  sphere: "Orb",
  cube: "Soft cube",
  mobius: "Möbius strip",
};

const RAMPS = [
  { label: "Classic", value: " .·-:=+*#%@" },
  { label: "Blocks", value: " ░▒▓█" },
  { label: "Precise", value: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$" },
  { label: "Minimal", value: "  .oO@" },
];

const PALETTES = ["#2348ff", "#ff5c35", "#00a878", "#111111", "#9b51e0"];

function rotate(point: Point, ax: number, ay: number, az: number): Point {
  const cx = Math.cos(ax), sx = Math.sin(ax);
  const cy = Math.cos(ay), sy = Math.sin(ay);
  const cz = Math.cos(az), sz = Math.sin(az);

  const apply = (x: number, y: number, z: number) => {
    const y1 = y * cx - z * sx;
    const z1 = y * sx + z * cx;
    const x2 = x * cy + z1 * sy;
    const z2 = -x * sy + z1 * cy;
    return {
      x: x2 * cz - y1 * sz,
      y: x2 * sz + y1 * cz,
      z: z2,
    };
  };

  const p = apply(point.x, point.y, point.z);
  const n = apply(point.nx, point.ny, point.nz);
  return { ...p, nx: n.x, ny: n.y, nz: n.z };
}

function pointCloud(shape: Shape, density: number, tube: number): Point[] {
  const points: Point[] = [];
  const tau = Math.PI * 2;

  if (shape === "torus") {
    const major = 1.48;
    const minor = 0.36 + tube * 0.48;
    for (let i = 0; i < density * 2; i++) {
      const u = (i / (density * 2)) * tau;
      for (let j = 0; j < density; j++) {
        const v = (j / density) * tau;
        const cv = Math.cos(v), sv = Math.sin(v);
        const cu = Math.cos(u), su = Math.sin(u);
        points.push({
          x: (major + minor * cv) * cu,
          y: (major + minor * cv) * su,
          z: minor * sv,
          nx: cv * cu,
          ny: cv * su,
          nz: sv,
        });
      }
    }
  } else if (shape === "sphere") {
    for (let i = 0; i < density * 2; i++) {
      const u = (i / (density * 2)) * tau;
      for (let j = 1; j < density; j++) {
        const v = (j / density) * Math.PI;
        const sv = Math.sin(v);
        const x = 1.72 * sv * Math.cos(u);
        const y = 1.72 * Math.cos(v);
        const z = 1.72 * sv * Math.sin(u);
        points.push({ x, y, z, nx: x / 1.72, ny: y / 1.72, nz: z / 1.72 });
      }
    }
  } else if (shape === "mobius") {
    const widthSteps = Math.max(9, Math.floor(density / 2));
    for (let i = 0; i < density * 3; i++) {
      const u = (i / (density * 3)) * tau;
      for (let j = 0; j < widthSteps; j++) {
        const v = -0.72 + (j / (widthSteps - 1)) * 1.44;
        const half = u / 2;
        const ring = 1.42 + v * Math.cos(half);
        const x = ring * Math.cos(u);
        const y = ring * Math.sin(u);
        const z = v * Math.sin(half);
        const nx = Math.cos(half) * Math.cos(u);
        const ny = Math.cos(half) * Math.sin(u);
        const nz = Math.sin(half);
        points.push({ x, y, z, nx, ny, nz });
      }
    }
  } else {
    const side = Math.max(10, Math.floor(density * 0.72));
    for (let face = 0; face < 6; face++) {
      for (let i = 0; i < side; i++) {
        for (let j = 0; j < side; j++) {
          const a = -1.4 + (i / (side - 1)) * 2.8;
          const b = -1.4 + (j / (side - 1)) * 2.8;
          const axis = Math.floor(face / 2);
          const sign = face % 2 === 0 ? -1 : 1;
          const coords = [a, b, sign * 1.4];
          const normals = [0, 0, sign];
          const order = axis === 0 ? [2, 0, 1] : axis === 1 ? [0, 2, 1] : [0, 1, 2];
          points.push({
            x: coords[order[0]], y: coords[order[1]], z: coords[order[2]],
            nx: normals[order[0]], ny: normals[order[1]], nz: normals[order[2]],
          });
        }
      }
    }
  }
  return points;
}

function renderAscii(
  settings: Settings,
  ax: number,
  ay: number,
  cols: number,
  rows: number,
) {
  const chars = new Array(cols * rows).fill(" ");
  const depths = new Float32Array(cols * rows);
  depths.fill(-Infinity);
  const points = pointCloud(settings.shape, settings.density, settings.tube);
  const ramp = settings.invert ? [...settings.ramp].reverse().join("") : settings.ramp;
  const lightA = (settings.light / 180) * Math.PI;
  const lx = Math.cos(lightA) * 0.7;
  const ly = -0.6;
  const lz = Math.sin(lightA) * 0.7;
  const baseScale = Math.min(cols / 7.3, rows / 4.7) * settings.scale;

  for (const source of points) {
    const p = rotate(source, ax + (settings.tilt * Math.PI) / 180, ay, ay * 0.18);
    const distance = p.z + 5.5;
    if (distance <= 0) continue;
    const perspective = baseScale / distance;
    const sx = Math.round(cols / 2 + p.x * perspective * 1.95);
    const sy = Math.round(rows / 2 - p.y * perspective);
    if (sx < 0 || sx >= cols || sy < 0 || sy >= rows) continue;
    const index = sx + sy * cols;
    const depth = 1 / distance;
    if (depth <= depths[index]) continue;
    depths[index] = depth;
    const luminance = Math.max(0, p.nx * lx + p.ny * ly + p.nz * lz);
    const rampIndex = Math.min(ramp.length - 1, Math.floor(luminance * (ramp.length - 1)));
    chars[index] = ramp[rampIndex] || ramp[ramp.length - 1] || "@";
  }

  let output = "";
  for (let row = 0; row < rows; row++) {
    output += chars.slice(row * cols, (row + 1) * cols).join("") + (row === rows - 1 ? "" : "\n");
  }
  return output;
}

function ControlRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="control-row">
      <div className="control-label">
        <span>{label}</span>
        {value && <output>{value}</output>}
      </div>
      {children}
    </div>
  );
}

function SettingsSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="settings-section">
      <CollapsibleTrigger className="section-trigger">
        <span>{title}</span>
        <ChevronDown aria-hidden="true" />
      </CollapsibleTrigger>
      <CollapsibleContent className="section-content">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export default function Home() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [playing, setPlaying] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [ascii, setAscii] = useState("");
  const [dimensions, setDimensions] = useState({ cols: 82, rows: 40 });
  const angles = useRef({ x: 0.3, y: 0.2 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  }, []);

  useEffect(() => {
    const resize = () => {
      const width = window.innerWidth;
      if (width < 540) setDimensions({ cols: 48, rows: 30 });
      else if (width < 900) setDimensions({ cols: 64, rows: 34 });
      else setDimensions({ cols: 82, rows: 40 });
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      if (playing) {
        angles.current.x += settings.speedX * delta;
        angles.current.y += settings.speedY * delta;
      }
      setAscii(renderAscii(settings, angles.current.x, angles.current.y, dimensions.cols, dimensions.rows));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [settings, playing, dimensions]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        setPlaying((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    type ModelContext = {
      registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const shapes = Object.keys(SHAPE_LABELS);
    void Promise.resolve(context.registerTool({
      name: "configure_ascii_scene",
      title: "Configure ASCII scene",
      description: "Update the visible ASCII shape, rotation speeds, density, scale, or colour.",
      inputSchema: {
        type: "object",
        properties: {
          shape: { type: "string", enum: shapes },
          speedX: { type: "number", minimum: -1.5, maximum: 1.5 },
          speedY: { type: "number", minimum: -1.5, maximum: 1.5 },
          density: { type: "number", minimum: 20, maximum: 54 },
          scale: { type: "number", minimum: 0.72, maximum: 1.24 },
          color: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Expected a settings object.");
        const next = input as Partial<Settings>;
        if (next.shape && !shapes.includes(next.shape)) throw new Error("Unknown shape.");
        setSettings((current) => ({ ...current, ...next }));
        return { updated: true, settings: next };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  const reset = () => {
    setSettings(DEFAULTS);
    angles.current = { x: 0.3, y: 0.2 };
    setPlaying(true);
  };

  const randomize = () => {
    const shapes = Object.keys(SHAPE_LABELS) as Shape[];
    setSettings((current) => ({
      ...current,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      speedX: Number((Math.random() * 1.6 - 0.8).toFixed(2)),
      speedY: Number((Math.random() * 1.6 - 0.8).toFixed(2)),
      tilt: Math.round(Math.random() * 60 - 30),
      light: Math.round(Math.random() * 160 - 80),
      color: PALETTES[Math.floor(Math.random() * PALETTES.length)],
    }));
    setPlaying(true);
  };

  return (
    <main className={`app-shell ${settings.grid ? "with-grid" : ""}`}>
      <header className="topbar">
        <a className="brand" href="#main-stage" aria-label="ASCII Donut Lab home">
          <CircleDot aria-hidden="true" />
          <span>ASCII / 01</span>
        </a>
        <div className="status" aria-live="polite">
          <span className={playing ? "status-dot is-live" : "status-dot"} />
          {playing ? "Rendering live" : "Paused"}
        </div>
        <p className="edition">Parametric playground</p>
      </header>

      <div className="workspace">
        <section
          id="main-stage"
          className="stage"
          aria-label="Interactive ASCII sculpture"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            angles.current.y += (event.clientX - drag.current.x) * 0.012;
            angles.current.x += (event.clientY - drag.current.y) * 0.012;
            drag.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
        >
          <div className="stage-index">01</div>
          <div className="axis-label axis-y">Y</div>
          <div className="axis-label axis-x">X</div>
          <pre
            className="ascii-art"
            style={{ color: settings.color }}
            aria-hidden="true"
          >
            {ascii}
          </pre>
          <span className="sr-only">
            Animated {SHAPE_LABELS[settings.shape]} rendered in ASCII characters.
          </span>
          <div className="stage-caption">
            <span>{SHAPE_LABELS[settings.shape]}</span>
            <span>{dimensions.cols} × {dimensions.rows}</span>
          </div>
          <div className="stage-actions">
            <Button
              className="play-button"
              size="icon-lg"
              onClick={() => setPlaying((current) => !current)}
              aria-label={playing ? "Pause animation" : "Play animation"}
            >
              {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            </Button>
            <span>Space to {playing ? "pause" : "play"} · Drag to rotate</span>
          </div>
        </section>

        <Collapsible open={panelOpen} onOpenChange={setPanelOpen} className="settings-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Control surface</span>
              <h1>Shape the signal</h1>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={panelOpen ? "Collapse settings" : "Expand settings"}>
                <SlidersHorizontal aria-hidden="true" />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="panel-content">
            <SettingsSection title="Geometry">
              <ControlRow label="Object">
                <Select value={settings.shape} onValueChange={(value) => update("shape", value as Shape)}>
                  <SelectTrigger className="wide-select" aria-label="Shape">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(SHAPE_LABELS) as [Shape, string][]).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ControlRow>
              <ControlRow label="Scale" value={`${Math.round(settings.scale * 100)}%`}>
                <Slider min={0.72} max={1.24} step={0.01} value={[settings.scale]} onValueChange={([value]) => update("scale", value)} aria-label="Scale" />
              </ControlRow>
              <ControlRow label="Point density" value={String(settings.density)}>
                <Slider min={20} max={54} step={1} value={[settings.density]} onValueChange={([value]) => update("density", value)} aria-label="Point density" />
              </ControlRow>
              {settings.shape === "torus" && (
                <ControlRow label="Tube weight" value={settings.tube.toFixed(2)}>
                  <Slider min={0.15} max={1} step={0.01} value={[settings.tube]} onValueChange={([value]) => update("tube", value)} aria-label="Tube weight" />
                </ControlRow>
              )}
            </SettingsSection>

            <SettingsSection title="Motion & light">
              <ControlRow label="X rotation" value={settings.speedX.toFixed(2)}>
                <Slider min={-1.5} max={1.5} step={0.01} value={[settings.speedX]} onValueChange={([value]) => update("speedX", value)} aria-label="X rotation speed" />
              </ControlRow>
              <ControlRow label="Y rotation" value={settings.speedY.toFixed(2)}>
                <Slider min={-1.5} max={1.5} step={0.01} value={[settings.speedY]} onValueChange={([value]) => update("speedY", value)} aria-label="Y rotation speed" />
              </ControlRow>
              <ControlRow label="Tilt" value={`${settings.tilt}°`}>
                <Slider min={-60} max={60} step={1} value={[settings.tilt]} onValueChange={([value]) => update("tilt", value)} aria-label="Tilt angle" />
              </ControlRow>
              <ControlRow label="Light angle" value={`${settings.light}°`}>
                <Slider min={-90} max={90} step={1} value={[settings.light]} onValueChange={([value]) => update("light", value)} aria-label="Light angle" />
              </ControlRow>
            </SettingsSection>

            <SettingsSection title="Glyphs & colour" defaultOpen={false}>
              <ControlRow label="Character set">
                <Select value={settings.ramp} onValueChange={(value) => update("ramp", value)}>
                  <SelectTrigger className="wide-select" aria-label="Character set">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RAMPS.map((ramp) => <SelectItem key={ramp.label} value={ramp.value}>{ramp.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </ControlRow>
              <ControlRow label="Ink">
                <div className="swatches" role="group" aria-label="ASCII colour">
                  {PALETTES.map((color) => (
                    <button
                      key={color}
                      className={settings.color === color ? "swatch is-selected" : "swatch"}
                      style={{ backgroundColor: color }}
                      onClick={() => update("color", color)}
                      aria-label={`Set colour ${color}`}
                      aria-pressed={settings.color === color}
                    />
                  ))}
                </div>
              </ControlRow>
              <div className="switch-row">
                <div><span>Reverse luminance</span><small>Swap highlights and shadow</small></div>
                <Switch checked={settings.invert} onCheckedChange={(value) => update("invert", value)} aria-label="Reverse luminance" />
              </div>
              <div className="switch-row">
                <div><span>Reference grid</span><small>Show the plotting field</small></div>
                <Switch checked={settings.grid} onCheckedChange={(value) => update("grid", value)} aria-label="Reference grid" />
              </div>
            </SettingsSection>

            <div className="panel-actions">
              <Button variant="outline" onClick={reset}><RotateCcw aria-hidden="true" />Reset</Button>
              <Button onClick={randomize}><Dices aria-hidden="true" />Surprise me</Button>
            </div>
          </CollapsibleContent>

          {!panelOpen && (
            <CollapsibleTrigger className="collapsed-panel">
              <Sparkles aria-hidden="true" />
              Open settings
            </CollapsibleTrigger>
          )}
        </Collapsible>
      </div>
    </main>
  );
}
