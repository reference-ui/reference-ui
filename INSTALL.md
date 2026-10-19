# Install Reference UI

Install and configure Reference UI in this project. Follow these steps in
order. Use only the commands, flags and config keys named here; do not invent
others.

## Context

Reference UI is a React authoring surface: style props, primitives, tokens
and CSS, compiled at build time by a Rust engine.

- `@reference-ui/lib` is the component library.
- `@reference-ui/core` provides the `ref` CLI and `defineConfig`.
- `ref sync` reads `ui.config.ts` and the source files its `include` globs
  match, then writes generated packages to `.reference-ui/` and links them
  into `node_modules/@reference-ui/` (`system`, `styled`, `react`, `types`).

Requirement: Node.js 22.18.0 or later. Use the project's existing package
manager (npm, pnpm, yarn or bun). The commands below use npm; translate them
if the project uses another manager.

## Steps

1. Install the packages. React is a peer dependency, so keep the project's
   existing `react` and `react-dom` if it already has them.

   ```bash
   npm install @reference-ui/lib react react-dom
   npm install --save-dev @reference-ui/core
   ```

2. Create the config. From the project root, run:

   ```bash
   npx ref init
   ```

   It writes `ui.config.ts` next to `package.json`:

   ```ts
   import { defineConfig } from '@reference-ui/core'
   import { baseSystem } from '@reference-ui/lib/baseSystem'

   export default defineConfig({
     name: '<package.json name, or my-app>',
     include: ['src/**/*.{ts,tsx}'],
     extends: [baseSystem],
   })
   ```

   Adjust `include` so it covers every file that uses Reference UI style
   props. If a `ui.config` file already exists, `ref init` writes nothing and
   exits 1. Keep that file, and check that its `include` covers those files
   and that its `extends` contains `baseSystem`, imported from
   `@reference-ui/lib/baseSystem`, never from `@reference-ui/lib`.

3. Add `.reference-ui` to `.gitignore`. Sync regenerates it.

4. Add sync to the `package.json` scripts:
   - Add `"sync": "ref sync"`.
   - Prefix the existing `build` script with `ref sync && `.
   - Run `ref sync --watch` next to the existing dev server, after one
     `ref sync`, for example with the `concurrently` package.

5. In the app entry file (for example `src/main.tsx`), import the generated
   stylesheet once, before any other app import:

   ```ts
   import '@reference-ui/react/styles.css'
   ```

6. Render one primitive to prove the setup:

   ```tsx
   import { Div } from '@reference-ui/react'

   <Div display="grid" gap="3r" padding="4r">Hello from Reference UI</Div>
   ```

## Verify

Run each check and report its output:

- `npx ref sync` exits 0 and prints a ready line with a CSS size.
- `.reference-ui/` contains `system`, `styled`, `react` and `types` folders.
- The project's type check passes.
- The dev server renders the `Div` with its padding applied.

If `ref sync` fails, report its full error message and stop. Do not work
around the error by editing files inside `.reference-ui/` or `node_modules/`.
