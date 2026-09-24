# Reference UI

Knowledge-first UI tooling and component infrastructure.

This repository is an active monorepo. It contains the Reference UI CLI, the first-party design system built on top of it, a docs site, Rust/native bindings, and pipeline-driven matrix coverage for generated outputs.

## What lives here

- `packages/reference-neo` - the `ref` CLI, sync pipeline, config/runtime generation
- `packages/reference-lib` - the first-party React design system package built on `@reference-ui/neo`
- `packages/reference-docs` - the Vite-based documentation site driven by the same sync pipeline
- `packages/reference-rs` - Rust/native bindings used by the platform
- `matrix/fixtures/*` - consumer-style fixture projects used by the chain matrix suites
- `matrix/tests/` - kept matrix suites (Vitest, Playwright, install stories) exercised by the Dagger pipeline

## Stack

- `pnpm` workspaces for package management
- `Nx` for monorepo task orchestration
- `TypeScript` across the JS/TS packages
- `Vite` for local app and docs development
- `React` for the docs site, consumer fixtures, and the first-party library surface
- `Vitest` and `Playwright` for automated verification
- `Rust` plus `napi-rs` for native bindings

## Getting started

Install dependencies from the repo root:

```bash
pnpm install
```

Common root commands:

```bash
pnpm dev           # docs site (or: pnpm dev lib)
pnpm dev:lib       # ref sync watch + Book for the library
pnpm test:lib      # library tests
pnpm test:rs       # Rust/native tests
pnpm pipeline test # matrix suites (Dagger)
```

## Core workflow

The center of the repo is `ref`, exposed by `@reference-ui/neo`.

- `ref sync` builds and synchronizes generated design-system output
- `ref sync --watch` keeps generated output current during development
- `mcp` runs the Reference UI MCP server (`@reference-ui/mcp`)

Most package-level dev and test flows build on top of that sync pipeline.

## Documentation

Engineering notes live in [`docs/`](./docs/). Start with [`docs/README.MD`](./docs/README.MD).

- [`docs/ARCHIVE/REFERENCE_UI.md`](./docs/ARCHIVE/REFERENCE_UI.md) — monorepo orientation
- [`docs/FEATURES/`](./docs/FEATURES/) — supported capabilities
- [`docs/BUGS/`](./docs/BUGS/) — open MCP / Atlas / core issues
- [`docs/ARCHIVE/`](./docs/ARCHIVE/) — retired specs and RFCs
- [`packages/reference-neo/README.md`](./packages/reference-neo/README.md)
- [`packages/reference-lib/README.md`](./packages/reference-lib/README.md)

## Status

The repo is in active development with implemented build, sync, docs, test, and release workflows. Expect ongoing iteration, but the platform is already operational.
