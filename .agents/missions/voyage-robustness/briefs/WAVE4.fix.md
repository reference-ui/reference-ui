# Brief — WAVE4.fix (crew: general, DeepSeek V4.1 Flash, `#high`)

Follow-up for the Oracle `WAVE4.micros.arc` review (LAND + P2-1/P3-1). Read
`reports/WAVE4.micros.arc.md` (the exact findings) and `GATES.md`. Work in
`/Users/ryn/Developer/reference-ui`, branch `reference-system`, at the then-HEAD.
Do not commit/push/stash; do not edit the pin baseline; do not touch
`packages/reference-rs/**`, the pre-existing untracked `pipeline/` files, the
`font-weight-runtime-1008` files, or the running docs dev server. Disclose
anything you did not touch. All scope is
`packages/reference-lib/scripts/check-dist-fresh.mjs`.

## P2-1 (P2 — the real one)

The sync leg is **mtime-based**: it fails when `newestSyncInput.mtimeMs >
baseSystem.mjs mtime`, but `sync/commit.ts:92` preserves an output's mtime when
its bytes are unchanged (`sameBytes`). So any `src/`/`book/` edit that leaves
sync bytes identical (comment, whitespace, component-logic-only — the common
lib-dev case) trips the gate, and `pnpm build` **cannot** clear it (tsup only
rewrites the dist leg; sync re-preserves `baseSystem.mjs`).

Make the sync leg **content-based** (recommended: sync writes a fingerprint of
its input set; the gate compares fingerprints) or an equivalent content-honest
mechanism. Do **not** fix by touching outputs inside the gate (fakes freshness)
or by an unconditional mtime bump in `commit.ts` (breaks the watcher-quiet
contract). Add a clear remedy message if a state still cannot be cleared.

Bar: reproduce the counterexample **before** (comment-only edit → build →
`check:dist` FAIL persists) and show it **after** (same edit → build →
`check:dist` OK); a genuine content change (e.g. a token edit) still FAILs the
gate naming `baseSystem.mjs`.

## P3-1 (P3 — small)

`SYNC_INPUTS` (`check-dist-fresh.mjs:44`) omits upstream `extends`/`layers`
inputs: lib `ui.config.ts` carries `layers: [iconsBaseSystem]`, so icons content
is embedded in lib's sync output, yet an icons re-sync with new bytes and no lib
input change leaves lib `baseSystem.mjs` stale with the gate green. Either track
the resolved upstream `baseSystem.mjs` files as sync inputs **or** record the
cross-package residual in `docs/bugs/NEO_EMIT_MODE_DRIFT.md` (low exposure: a
full build heals it). Pick the smaller honest option and say which.

## P4-5 (cosmetic)

Reword `check-dist-fresh.mjs`'s OK message, which is literally false in the green
state whenever a packaging-only input postdates `baseSystem.mjs`.

## Prove

`pnpm agentneo q` 0 errors; lib `check:dist` OK on a clean tree; the P2-1
reproduction pair above; `verify-pins` PASS (no pin change).

## Output

Write `.agents/missions/voyage-robustness/reports/WAVE4.fix.md`, append to
`.agents/missions/voyage-robustness/WAVE4.md`, reply with a short summary +
VERDICT.
