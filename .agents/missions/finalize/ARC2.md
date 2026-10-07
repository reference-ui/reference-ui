# ARC2 — Tasty off the one-shot critical path

STATUS: CUT — post-Arc-1 the drain is 110–121 ms; isolation cannot keep REF-10

Where: `packages/reference-neo/src/cli/sync.ts:43-44`,
`reference/bridge/{init,tasty-build,run}.ts`.

Pick one (a/b/c per report). Bar: cold one-shot `ref sync` on docs reports
≤ ~2s; manifest still lands (a later sync retries a failed background build,
`sync/index.ts:64-72`); `ref sync --json` diagnostics stay parseable; neo
suite green; `pnpm agentneo q` clean.

Prefer a TS-only option (a)/(c) so this arc stays disjoint from ARC1's Rust.

## Post-Arc-1 reassessment (captain directive)

Arc 1 landed first (`7a83e9fa7`) and dropped cold one-shot to ~1.9s, so the
report's `≤ ~2s` timing bar is now met **without** Arc 2. Before changing
anything, determine with evidence whether isolation still adds real value on
the post-Arc-1 tree. Note the hard constraint in
`reference/bridge/init.ts`: the one-shot drain exists so `types/tasty/` lands
before a consuming build (REF-10), so the manifest must still land before the
sync process exits. If the only honest effect is printing the `ready` line a
few hundred ms earlier, or the change cannot keep the manifest-landing
contract, return `VERDICT: CUT` with the measurements and reasoning rather
than forcing a change. If there is a real win (accurate `ready` semantics,
genuine incremental skip, or failure isolation that cannot break REF-10),
land it and prove it.

## Entries

- **ARC2.impl (DeepSeek V4.1 Flash, `#high`) — VERDICT: CUT.** Post-Arc-1 the
  docs cold one-shot drain is only **110–121 ms** (atomic ~1.65 s; total
  ~1.79 s), so the `≤ ~2 s` bar is already met and isolation would relabel the
  `ready` line by ~0.11 s at most. Option (a) also breaks REF-10: an undrained
  one-shot that exits (as `bin/ref.js`'s `process.exit` does) leaves
  `types/tasty/manifest.js` **absent** — proven with a temp harness. Option (b)
  is a Rust-scoped killed-run-only skip; (c) is new surface for ~0.11 s.
  Unchanged tree proven green: `agentneo q` 0 errors; vitest 557–558/559 with
  only the documented pre-existing failures; `--json` parseable; manifest lands.
  Full evidence: `reports/ARC2.impl.md`.
