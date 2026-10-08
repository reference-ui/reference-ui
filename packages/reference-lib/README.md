# @reference-ui/lib

Foundational design system package built on `@reference-ui/neo`.

## Exports

- `@reference-ui/lib`: every component
- `@reference-ui/lib/baseSystem`: the design-system payload for downstream `extends: [baseSystem]` in `ui.config.ts` — a zero-import module; import this, not the component barrel
- `@reference-ui/lib/theme`: the plain theme objects used to build that system
- `@reference-ui/lib/styles.css`: the compiled stylesheet (import once at your app root)
- `@reference-ui/lib/primitives`: layout/text primitives (`Div`, `Span`, `Button`, `Label`, …) plus `css`/`recipe`

## Consumer setup

```bash
npm install @reference-ui/lib react react-dom
```

```tsx
// main.tsx — order matters: stylesheet first, then your app.
import '@reference-ui/lib/styles.css'
import { ReferenceLibrary } from '@reference-ui/lib'
import { Div, Span, Button } from '@reference-ui/lib/primitives'
```

Notes:

- No bundler aliases needed. (Older guides mention aliasing `@reference-ui/react` —
  that was the unpublished codegen package; `@reference-ui/lib/primitives` replaces it.)
- `react` is a peer dependency: the app owns the one React copy (required for hooks/SSR).
- Styling your own values: the shipped CSS only contains rules for values used inside
  the library. App-only values (e.g. `maxW="140r"` when nothing in the lib uses `140r`)
  construct a class that paints nothing and dev-warns. Either reuse documented values or
  run `ref sync` with `extends: [baseSystem]` to compile your own sheet. In
  `ui.config.ts`, import it from `@reference-ui/lib/baseSystem`; importing the
  component barrel instead evaluates ~3,900 icon modules (~1.5 s) on every
  `ref sync` startup.

## Bundle & code-splitting

The package ships one JS entry (`dist/index.mjs`, ~3.6MB uncompressed at 0.0.46 —
dominated by the ~3,857-icon barrel) plus the 255KB stylesheet and the 160KB
primitives runtime. There are no per-component subpaths; instead the package relies on
standard ESM tree-shaking:

- `package.json` sets `"sideEffects": false`, and every export is a named ESM export,
  so production builds (`vite build`, webpack `production`) drop unused components and
  icons automatically. Import from the barrel (`@reference-ui/lib`) — do not deep-import
  `dist/` paths, which are not part of the contract.
- The stylesheet is a single file and is NOT tree-shaken: your app downloads rules for
  every library value (~255KB raw, ~33KB gz). If that matters, generate a minimal sheet
  with `ref sync` + `extends: [baseSystem]` instead of importing the shipped CSS.
- `react`/`react-dom` stay external (peer + dev-only): they are never bundled into
  `dist/index.mjs`, so the browser bundle contains zero Node builtins (asserted at pack
  time and in the consumer-smoke CI gate).

## Usage

```bash
pnpm run sync   # Run ref sync once
pnpm run dev    # Watch mode
```

## Testing

Component primitives are implemented in this package and proven in `matrix/lib` with Playwright. React 19 is the default agent loop; 17 and 18 are compatibility jobs for that fixture only. See [TESTING.md](./TESTING.md).

## Component playground (Book)

Book is the component playground for `@reference-ui/lib`. It lives at `packages/reference-lib/book/` and serves on port 5000 as a single-document Fast Refresh app. Component stories are authored alongside components in `src/components/**/*.book.tsx`. Core stories (for example `useMeasure`) live next to their source in `src/core/**/*.book.tsx`.

To launch Book: run `pnpm dev:lib` from the repository root (or `pnpm run dev` within this package). Open [http://localhost:5000](http://localhost:5000). To capture component states via Playwright, use `pnpm capture <Component>`.

```ts
// ui.config.ts — extends the library system
import { baseSystem } from '@reference-ui/lib/baseSystem'
import { colors, fonts } from '@reference-ui/lib/theme'
```
