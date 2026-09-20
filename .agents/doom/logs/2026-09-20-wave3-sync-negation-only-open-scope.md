---
date: 2026-09-20
cycle: 7
module: reference-core sync (atomic include scope at the native bridge)
theories_spent: 1
verdict: break-found
---

# Negation-only include silently compiles the full scan

## Hypothesis

The gap: a negation-only `include` list on the frozen native request
(e.g. `['!outside/**']`) is silently treated as open scope — the
negatives are dropped and every scanned source compiles, including the
explicitly excluded ones.

Theory 1 (spent, RED): `IncludeScope::is_open()` returns true whenever
no positive pattern exists (`includes/mod.rs:40-43`, `matches`/`matches_file`
early-return), so a non-empty all-negative list skips the negative check
entirely. The red test `/tmp/doom-wave3-sync-negation-only.mjs` drives
`compileSystem` with the exact request shape neo sync sends and asserts
the excluded source stays out. Controls pass (`!` carves correctly with
positives present); the negation-only probe fails: the excluded file's
want is extracted.

No further theories spent — one candidate break in hand, hunt stopped
per protocol. Research ruled out without spending: link poisoning
self-heals (`links.ts` unlinks first), traced-host scope reuses the same
`collect` (`entries.rs`), brace expansion handles nesting/empties.

## Verdict

`break-found`. Repro: `/tmp/doom-wave3-sync-negation-only.mjs`
(blind-runnable: `node /tmp/doom-wave3-sync-negation-only.mjs [repo-root]`;
exit 1 = violated, controls PASS + probe FAIL).

Violated contract (two citations, one flavor oracle):
- `packages/reference-rs/contracts/types.ts` (frozen wire format): "only
  matching sources compile and the rest are skipped silently. Absent or
  empty preserves the legacy scan-all behavior." A negation-only list is
  neither absent nor empty, yet the scope is open.
- `packages/reference-rs/modules/atomic/src/includes/mod.rs:3-6`:
  "Patterns follow fast-glob flavor ... a leading `!` negates. An absent
  or empty include list leaves the scope open." The code opens the scope
  for a non-empty list.
- Oracle: `fast-glob.sync(['!outside/**'])` returns `[]` (verified
  in-session against the repo's own fast-glob) — the engine compiles
  everything instead.

Severity: user-facing. An author excluding a directory (generated code,
vendored fixtures, a half-migrated tree with parse errors or unknown
tokens) gets its styles compiled anyway — junk atoms, or error
diagnostics (build failure) from explicitly excluded files — with zero
signal that the exclusion was dropped. Second symptom, same root: sync
incoherence — the watch matcher over the SAME config field
(`picomatch(['!outside/**'])`, `watch.ts`) excludes `outside/**`, so
excluded files' styles bake into the bundle at baseline sync but never
trigger a rebuild. Fix direction (all-negative means empty scope vs
scan-all-minus-negatives) is an architect call; the repro asserts only
the point both readings agree on (excluded stays out). Doom log was
thin on sync (no prior sync-surface hunts) — noted for scheduling.
