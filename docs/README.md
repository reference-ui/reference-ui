# Docs

Living notes for the Reference UI monorepo. The published site is `packages/reference-docs`. This tree is the engineering map.

Scope codes on filenames: `NEO` (`@reference-ui/neo`), `RS` (`@reference-ui/rust`), `LIB` (`@reference-ui/lib`), `MCP` (`@reference-ui/mcp`). `MISSIONS/` files are voyage records (see its index).

## Start here

- [ARCHITECTURE.MD](./ARCHITECTURE.MD) — the ONE architecture doc (what the system IS now, verified)
- [LANGUAGE/](./LANGUAGE/PUBLIC-API.MD) — the style language: [public API](./LANGUAGE/PUBLIC-API.MD), [CSS](./LANGUAGE/CSS.MD), [primitives](./LANGUAGE/PRIMITIVES.MD)
- [FEATURES/](./FEATURES/) — capabilities the system actually supports (incl. [RS_ATOMIC.md](./FEATURES/RS_ATOMIC.md), the compiler overview, and [LIB_BOOK.md](./FEATURES/LIB_BOOK.md), the Book playground contract)
- [MISSIONS/](./MISSIONS/) — active missions and ideas ([COMPLETED/](./MISSIONS/COMPLETED/) for done)
- [SECURITY.md](../SECURITY.md) — vulnerability reporting (GitHub looks for this at the repo root)

## Open issues

[BUGS/](./BUGS/) — MCP, Atlas, and Neo runtime issues. (The panda-era
core-debt audit lived here as `JANK.md` until the engine swap landed;
`reference-core` is retired, so it was deleted 2026-09-23.)

## Records

[ARCHIVE/](./ARCHIVE/) — retired specs, RFCs, and pre-cutover maps (incl. the
filed `REFERENCE_UI.md` orientation record). [EVIDENCE/](./EVIDENCE/) —
immutable measurement bundles. [PERF/](./PERF/) — live agent-perf corpus.
(Pre-cutover `HIST_*` maps and `RELEASE.md` were deleted 2026-09-23 per docs
milspec; history lives in git.)
