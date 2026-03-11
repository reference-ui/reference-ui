# microbundle

Tiny esbuild wrapper for in-memory bundling.

This module exists so the rest of `reference-core` can ask for "bundle this
file to a string" without repeating esbuild setup, default externals, or alias
plugin wiring.

## What it owns

- building esbuild options for small internal bundles
- in-memory output (`write: false`)
- default externals for heavy tool dependencies
- optional module-id aliasing
- selectable output formats (`esm`, `cjs`, `iife`)

## Main consumers

- `config/*` bundles `ui.config.ts`
- `lib/fragments/*` bundles fragment files and runtime adapters
- packaging flows can reuse it for small internal transforms

## What it does not own

- temp-file execution
- config validation
- fragment execution
- package installation

It only produces bundled JavaScript strings.
