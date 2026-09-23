IN PROGRESS

# LOG-3 — Objective 3: lib sync ~650ms

Brief: [VOYAGE.md](./VOYAGE.md) Objective 3. Lands one commit.
Crew shape: voyage captain protocol (research → implementers →
reviewers; captain verifies firsthand and commits).

## Status

Briefed as an open investigation — no cause stated, hunch deliberately
withheld so the crew determines it independently. Probe crew
(lib-sync-probe) returned 2026-09-22, read-only.

Probe findings (feeds objective kickoff):

- `dev:lib` pays two full Neo syncs (one-shot + watch baseline); the
  651ms is one `sync()`, comparable to bench `syncMs`.
- Only 325 ts/tsx files in scope (1.97 MB) — file count ruled out as
  primary. Engine/path correct (release N-API, Neo sync, single read,
  no backfill); dist/node_modules/snapshots excluded.
- #1 cause: the engine skip gate fails on 324/325 files (keys on
  `import`, which every file has), so every test/story/fixture rides
  the full retained-file pipeline. ~69% of bytes are dev-only.
- #2: barrel tracing — `src/index.ts` is 211 KB with ~3,890
  re-exports + 26 `export *`, each resolved through StyleTrace.
- #3: fragment-bundle fan-out — 32 esbuild bundles vs bench's 2.
- Fix direction: narrow `include` with negations (tests, e2e,
  stories, books, fixtures) after verifying negation support.
- Confirming probe (needs approval, rewrites lib `.reference-ui`):
  `REFERENCE_UI_PHASES_OUT=/tmp/neo-lib-phases.json node
  packages/reference-neo/benchmark/measure/worker.ts
  packages/reference-lib 5`
