# Playground

The expendable mess-around loop. One synced React app for trying combinations
fast and screenshotting — then formalising what you find as a Neo case. It is
not tests: nothing here asserts about the system. But the package typegate
covers playground sources, so keep it green — delete it before letting it rot.

```bash
pnpm playground                         # sync fresh, serve at http://localhost:5199/
pnpm playground:capture                 # every route, dark, to .captures/
pnpm playground:capture kitchen         # one route
pnpm playground:capture --theme both    # dark + light (<route>.<theme>.png)
```

Routes are hash pages auto-discovered from `src/pages/*.tsx` (filename is
the route) with a Book-like side menu (search with `/`, theme toggle in the
header). A page exports `meta` (menu title + blurb) and `Page` (the content)
— adding a route is adding one file. The menu shell is harness chrome:
inline styles only, so it works even when the system under test is broken.
Page content uses the system (`css()`, `recipe()`, primitives, `globalCss()`).

The shell stamps `data-color-mode` on `<html>` (dark by default, synced to
`?theme=`), which drives the engine's token islands and `_dark` wraps.
`src/tokens.ts` is the mini token set: tailwind's palette verbatim plus
`ink`/`paper`/`brand` with dark leaves, animation tokens, spacing, and
lib's radii. `src/motion.ts` holds the keyframes those animation tokens
name, and `src/global.ts` the tag recipes.

Capture starts its own server; `pnpm playground` is only for interactive
poking in a browser.

Layout: `index.html` is the minimal vite entry (no inline style or
script — the undercoat lives in `src/base.css`, the pre-paint theme
stamp in `src/theme-init.js`). `src/` holds the app (shell, tokens,
motion, pages). `tools/` holds the harness (`serve.mjs`, `capture.mjs`,
`lib.mjs` shared boot); both npm scripts point there. Sync output and
screenshots (`.reference-ui/`, `.captures/`) stay gitignored at root.

Why no `public/`: vite serves the entry from the project root and only
processes scripts, styles, and aliases from that entry. Files under
`public/` are copied verbatim with no module graph, so moving the entry
there would unplug the TSX shell, the css/link pipeline, and the
`@reference-ui/react` alias. `index.html` stays at root and stays tiny.

Minimal page (`src/pages/hello.tsx` → `#/hello`):

```tsx
import type * as React from 'react';
import { css } from '@reference-ui/styled';

export const meta = { title: 'Hello', blurb: 'scratch' };

export function Page(): React.JSX.Element {
  return <div className={css({ backgroundColor: 'violet.500', color: 'paper', p: 'sm' })}>hi</div>;
}
```

Rules for app sources:

- No value imports from `react`: the generated entry bundles its own React
  and exports no hooks, so a second copy breaks hook calls. The shell is
  hook-free (`createRoot` + explicit render); pages use `css()`/primitives.
- `css()` values must be static literals: extraction reads literal calls, so
  a dynamic ref resolves to nothing (no class, no error).
- Never import `createElement`/`Fragment`: the vite banner (like the
  case-world build) owns those bindings.
