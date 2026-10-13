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

## Your tokens on lib props

Run `ref sync` in your app and lib's style props take your token types. `strict` in
`ui.config.ts` decides how narrow they are: name the categories you want enforced (`colors`,
`radii`, `spacing`) and a value outside their tokens fails to type-check on a lib component, as it
does in your own JSX. Leave `strict` out and lib props stay open. Run sync again after you install
or upgrade lib.

Sync's types reach your program through `@reference-ui/react`. An app that never imports it adds
this line to its `env.d.ts`, or its lib props stay open:

```ts
/// <reference types="@reference-ui/react" />
```

## Theming lib with your brand (layers + extendSystem)

Lib's design system is the `@reference-ui/lib/baseSystem` payload. You can build on it two ways, and they differ in
what happens to lib's tokens.

`extends: [baseSystem]` adopts lib's tokens and types into your own system, and your tokens win wherever you set the
same path.

`layers: [...]` keeps lib isolated: its tokens sit under lib's own `data-layer` scope, so they stay apart from yours.
To rebrand a layered lib, wrap it in `extendSystem` in your own module:

```ts
// src/system/lib.ts
import { extendSystem } from '@reference-ui/neo'
import { baseSystem } from '@reference-ui/lib/baseSystem'

export const brandedLib = extendSystem(baseSystem, {
  tokens: {
    colors: {
      design: {
        primary: {
          background: { light: '#0f766e', dark: '#5eead4' },
        },
      },
    },
  },
})
```

```ts
// ui.config.ts
import { defineConfig } from '@reference-ui/neo'
import { brandedLib } from './src/system/lib'

export default defineConfig({
  name: 'my-app',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
  layers: [brandedLib],
})
```

`extendSystem` overrides the lib tokens you name and leaves the rest of lib as it is. Its v1 limits:

- Existing token names only. An override of a token lib does not declare fails sync with an error that names it.
- Tokens only. There are no recipe or globalCss overrides yet.
- One branding of lib per app. A branded lib keeps lib's name, so a second branded lib in the same config repeats
  that name, and sync rejects it.
- An override must not point at a lib token that lib builds from the token being overridden. The two would refer to
  each other, which is a CSS cycle. `extendSystem` only rejects a direct self-reference.

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

To launch Book: run `pnpm dev:lib` from the repository root (or `pnpm run dev` within this package). Open [http://localhost:5000](http://localhost:5000). To view component states, drive it with Chrome DevTools MCP (`navigate_page` to `?book=<Component>&story=<Story>`, then `take_screenshot`).

```ts
// ui.config.ts — extends the library system
import { baseSystem } from '@reference-ui/lib/baseSystem'
import { colors, fonts } from '@reference-ui/lib/theme'
```
