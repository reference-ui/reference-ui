# Reference UI

Knowledge-first UI tooling and component infrastructure.

This repository is an active monorepo. It contains the Reference UI CLI, the first-party design system built on top of it, a docs site, a unit-level dogfood app, Rust/native bindings, and end-to-end coverage for generated outputs.

## What lives here

- `packages/reference-core` - the `ref` CLI, sync pipeline, config/runtime generation, and MCP entrypoints
- `packages/reference-lib` - the first-party React design system package built on `@reference-ui/core`
- `packages/reference-unit` - a local app used to validate generated runtime behavior and fixture composition
- `packages/reference-docs` - the Vite-based documentation site driven by the same sync pipeline
- `packages/reference-e2e` - Playwright-based matrix and quick-run system tests
- `packages/reference-rs` - Rust/native bindings used by the platform
- `fixtures/*` - consumer-style fixture projects used by unit and system tests
- `matrix/` - top-level matrix scenario area for the next generation of install and TypeScript coverage

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
pnpm dev           # core + docs
pnpm dev:lib       # core sync watch + React Cosmos for the library
pnpm build         # build all workspace packages
pnpm test          # core build + end-to-end coverage
pnpm test:lib      # core build + library tests
pnpm test:core     # reference-core tests
pnpm test:app      # reference-unit tests
pnpm test:rust     # Rust/native tests
```

## Core workflow

The center of the repo is `ref`, exposed by `@reference-ui/core`.

- `ref sync` builds and synchronizes generated design-system output
- `ref sync --watch` keeps generated output current during development
- `ref mcp` runs the Reference UI MCP server

Most package-level dev and test flows build on top of that sync pipeline.

## Documentation

High-level architecture and repo notes live in:

- `docs/Architecture.md`
- `docs/CORE.md`
- `docs/STRUCTURE.md`
- `docs/PUBLIC API.md`
- `packages/reference-core/README.md`
- `packages/reference-lib/README.md`

## Status

The repo is in active development with implemented build, sync, docs, test, and release workflows. Expect ongoing iteration, but the platform is already operational.
