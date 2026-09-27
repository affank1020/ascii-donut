# ASCII Donut

[![CI](https://github.com/affank1020/ascii-donut/actions/workflows/ci.yml/badge.svg)](https://github.com/affank1020/ascii-donut/actions/workflows/ci.yml)

A rotating ASCII torus rendered in React and Next.js.

## Run locally

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The GitHub Actions pipeline runs the same checks for every pull request and every
push to `main`. Unit tests cover quaternion rotation, perspective projection,
lighting, and frame generation for each supported shape.

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
