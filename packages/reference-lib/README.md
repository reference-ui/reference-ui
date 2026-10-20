# @reference-ui/lib

Foundational design system package built on `@reference-ui/core`.

## Exports

- `@reference-ui/lib`: every component
- `@reference-ui/lib/baseSystem`: the design-system payload for downstream `extends: [baseSystem]` in your UI config — a zero-import module; import this, not the component barrel
- `@reference-ui/lib/theme`: the plain theme objects used to build that system
- `@reference-ui/lib/styles.css`: the compiled stylesheet (import once at your app root)

## Consumer setup

```bash
npm install @reference-ui/lib react react-dom
```

```tsx
// app entry — order matters: stylesheet first, then your app.
import '@reference-ui/lib/styles.css'
import { ReferenceLibrary, Tabs } from '@reference-ui/lib'
```

Notes:

- No bundler aliases needed.
- Primitives such as `Div` and `Button` come from `@reference-ui/react`, which `ref sync`
  generates in your app (see "Your tokens on lib props" below).
- `react` is a peer dependency: the app owns the one React copy (required for hooks/SSR).
- Styling your own values: the shipped CSS only contains rules for values used inside
  the library. App-only values (e.g. `maxW="140r"` when nothing in the lib uses `140r`)
  construct a class that paints nothing and dev-warns. Either reuse documented values or
  run `ref sync` with `extends: [baseSystem]` to compile your own sheet. In
  your UI config, import it from `@reference-ui/lib/baseSystem`; importing the
  component barrel instead evaluates ~3,900 icon modules (~1.5 s) on every
  `ref sync` startup. Sync names that cost: when `ui.config` takes over 750 ms
  to evaluate, it prints one `BSS-W-SLOW-CONFIG` warning naming the barrel and
  the subpath to import instead.

## Your tokens on lib props

Run `ref sync` in your app and lib's style props take your token types. `strict` in
your UI config decides how narrow they are: name the categories you want enforced (`colors`,
`radii`, `spacing`) and a value outside their tokens fails to type-check on a lib component, as it
does in your own JSX. Leave `strict` out and lib props stay open. Run sync again after you install
or upgrade lib.

Sync's types reach your program through `@reference-ui/react`. An app that never imports it adds
this line to its ambient types file, or its lib props stay open:

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
// your system module
import { extendSystem } from '@reference-ui/core'
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
// your UI config
import { defineConfig } from '@reference-ui/core'
import { brandedLib } from './src/system/lib'

export default defineConfig({
  name: 'my-app',
  include: ['<your sources>'],
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

The package ships one JS entry (~3.6MB uncompressed at 0.0.46 —
dominated by the ~3,900-icon barrel) plus the 255KB stylesheet and the 160KB
primitives runtime. There are no per-component subpaths; instead the package relies on
standard ESM tree-shaking:

- The package manifest sets `"sideEffects": false`, and every export is a named ESM export,
  so production builds (`vite build`, webpack `production`) drop unused components and
  icons automatically. Import from the barrel (`@reference-ui/lib`) — do not deep-import
  `dist/` paths, which are not part of the contract.
- The stylesheet is a single file and is NOT tree-shaken: your app downloads rules for
  every library value (~255KB raw, ~33KB gz). If that matters, generate a minimal sheet
  with `ref sync` + `extends: [baseSystem]` instead of importing the shipped CSS.
- `react`/`react-dom` stay external (peer + dev-only): they are never bundled into
  the shipped entry, so the browser bundle contains zero Node builtins (asserted at pack
  time and in the consumer-smoke CI gate).

## Usage

```bash
pnpm run sync   # Run ref sync once
pnpm run dev    # Watch mode
```

## Internal state

Shared state that would otherwise need React Context uses Zustand as a
direct dependency — never vendored, ported, or reimplemented. Stores
stay internal: consumers never import `zustand`, a store factory, or a
generic `useStore`. The public seam is Reference-owned, domain-specific
hooks and actions where a component spec names them (`toast.show`,
`announce`), plus the usual props and parts. Native Context is allowed
only for genuine subtree scoping (a part finding its owner); it is
never a public Provider. Applications are not required to wrap trees
in a Provider — the library mount is a document-scoped mount, not a
context boundary. Each owner's spec documents store shape, actions,
selectors, hooks, lifecycle, isolation, and multi-root behavior.

## Testing

Component primitives are implemented in this package and proven with
Playwright in each component's browser suite. The proof rule: a case
is proven when a passing test title contains its ID. Each component's
contract doc states the API, its case catalog holds each case's setup,
action, and assert rows (catalog checkboxes mean specified, not
proven), its browser suite proves the public API, and colocated unit
tests beside the code prove pure models. Book is for looking;
Playwright is for asserting.

```bash
pnpm agentct <Name> --e2e              # one component's browser proof
pnpm agentct <Name> -g "<CASE-ID>"     # one contract by stable ID
pnpm agentct <Name> --e2e --react 17   # compatibility runtimes: 17, 18, 19, all
```

React 19 is the default agent loop; 17 and 18 are compatibility jobs.
Here **freeze** means the current falsifiable design decision, not
gospel: vendor regressions, platform evidence, type contradictions,
and better ownership arguments change APIs, cases, defaults, parts, or
inventory before manufacture. A test is never weakened to protect a
prior decision.

## Component playground (Book)

Book is the component playground for `@reference-ui/lib`. It lives in this package and serves on port 5000 as a single-document Fast Refresh app. Component stories are authored alongside components. Core stories (for example `useMeasure`) live next to their source.

To launch Book: run `pnpm dev:lib` from the repository root (or `pnpm run dev` within this package). Open [http://localhost:5000](http://localhost:5000). To view component states, drive it with Chrome DevTools MCP (`navigate_page` to `?book=<Component>&story=<Story>`, then `take_screenshot`).

```ts
// your UI config — extends the library system
import { baseSystem } from '@reference-ui/lib/baseSystem'
import { colors, fonts } from '@reference-ui/lib/theme'
```

Part of Reference UI. Component test catalog: the Component Cases catalog.
