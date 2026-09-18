# Docs

Living notes for the Reference UI monorepo. The published site is `packages/reference-docs`. This tree is the engineering map.

## Start here

- [REFERENCE_UI.md](./REFERENCE_UI.md) — long-form orientation of the monorepo
- [FEATURES/](./FEATURES/) — capabilities the system actually supports
- [BOOK.md](./BOOK.md) — Book playground contract (`pnpm dev:lib`)
- [RELEASE.md](./RELEASE.md) — changesets and pipeline publish
- [SECURITY.md](../SECURITY.md) — vulnerability reporting (GitHub looks for this at the repo root)

## Architecture (historical, still useful)

These predate the native engine campaign. Paths inside them drift (`src/cli/`, `src/styled/`). Prefer current code and [packages/reference-neo/PLAN.md](../packages/reference-neo/PLAN.md) when they disagree.

- [Architecture.md](./Architecture.md)
- [CORE.md](./CORE.md)
- [STRUCTURE.md](./STRUCTURE.md)
- [LAYERS.md](./LAYERS.md)
- [PUBLIC API.md](./PUBLIC%20API.md)

## Open issues

[bugs/](./bugs/) — MCP, Atlas, and leftover core debt. Panda-era items in `JANK.md` wait on the engine swap.

## Archive

[archive/](./archive/) — shipped restructures, retired RFCs, and research that is no longer the plan.
