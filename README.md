# ASCII Donut

A rotating ASCII torus rendered in React and Next.js.

## Run locally

```bash
npm install
npm run dev
```

## Rendering pipeline

The UI in `app/page.tsx` owns viewport sizing and the animation loop. The maths
is isolated in `lib/donut`:

1. `shape.ts` evaluates the parametric torus equation and surface normal.
2. `matrix.ts` builds and combines rotation matrices, then transforms vectors.
3. `projection.ts` applies perspective projection to screen coordinates.
4. `lighting.ts` calculates diffuse light and maps it to ASCII glyphs.
5. `render.ts` samples the surface, runs the pipeline, and resolves visibility
   with a depth buffer.

## Deploy

The project is a standard Next.js app and can be imported directly into Vercel.
