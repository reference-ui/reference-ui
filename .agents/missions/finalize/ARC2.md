# ARC2 — Tasty off the one-shot critical path

STATUS: PENDING

Where: `packages/reference-neo/src/cli/sync.ts:43-44`,
`reference/bridge/{init,tasty-build,run}.ts`.

Pick one (a/b/c per report). Bar: cold one-shot `ref sync` on docs reports
≤ ~2s; manifest still lands (a later sync retries a failed background build,
`sync/index.ts:64-72`); `ref sync --json` diagnostics stay parseable; neo
suite green; `pnpm agentneo q` clean.

Prefer a TS-only option (a)/(c) so this arc stays disjoint from ARC1's Rust.

## Entries
