# CLOSEOUT — voyage-one-shot

Mission: cut one-shot `ref sync` startup on the docs app. Branch
`reference-system`; vice base `685bc21b9` → tip `6c0527467`. Crews DeepSeek V4.1
Flash (`#high`); Oracle (Muse Spark 1.3 Contributor, Max effort) at plan,
harness, arc, and (now) closeout.

## Headline

One-shot `ref sync` on docs: **~1.9 s → ~295 ms** (~6.5×). The 1.5 s was
`loadUserConfig` evaluating the `@reference-ui/lib` barrel — 99.85% of it the
icons fan-out (~7,728 module loads). R1 replaces that import with a zero-import
`./baseSystem` subpath.

| metric | before | after |
| --- | ---: | ---: |
| config-import module loads | 7,728 | **2** |
| docs config phase | 1,548 ms | **20 ms** |
| atomic `syncTotal` | 1,673 ms | **146 ms** |
| CLI `ref sync` ready-in | ~1,900 ms | **~295 ms** |

## Outcomes

| wave | verdict | evidence |
| --- | --- | --- |
| Plan (PLAN.oracle) | ranked routes; R1 first, R2 backup, R4 gated, R5/R7 CUT, R6/R8/R9/R10 parked | `reports/PLAN.oracle.md` |
| Wave 0 (recon) | baseline 1,548 ms; census 7,728 (icons 99.85%); pins verified | `MEASURE.md`, `pins/` |
| Wave 0 harness review | approved conditionally → frozen `GATES.md` | `reports/WAVE0.oracle.md` |
| Wave 1 (R1) | **LAND** (`5ea3dcdca`) with captain re-baseline | `reports/WAVE1.arc.md` |
| R4 | **CUT by evaporation** (residual ~20 ms; sound key ≈ prize) | `WAVE1.arc.md §5` |
| W1-1 emit-mode drift | **filed** separate topic | `docs/bugs/NEO_EMIT_MODE_DRIFT.md` |
| Wave 1.5 (W1-5/W1-6) | **LANDED** (`6c0527467`) | `reports/WAVE1.5.fix.md` |

## Commits

```
6c0527467 test(neo): tighten upstream hint + barrel guard (Oracle W1-5/W1-6)
e9952707f chore(voyage): file emit-mode drift topic (W1-1); dispatch Wave 1.5 fix
5ea3dcdca perf(lib): reach baseSystem via ./baseSystem subpath, not the barrel
0a9008d59 chore(voyage): R1 verified (census 2, config ~20ms); HOLD on identity
ad5babf63 chore(voyage): freeze Wave 0 gates + ordered proof protocol per Oracle
ea102a5cc chore(voyage): dispatch Wave 0 harness review + Wave 1 R1
29e3e4d3e chore(voyage): Wave 0 recon — 1548ms config baseline, 7728-load census, pins
50df627bd chore(voyage): record Oracle plan; open Wave 0 recon
c5fba023c chore(voyage): scaffold one-shot startup voyage + measurement harness
7c4847f01 docs(perf): one-shot ref sync is config-load-bound, not compiler-bound
```

## R1 (the land)

`@reference-ui/lib` `exports["./baseSystem"]` (`types` + `import` →
`.reference-ui/system/baseSystem.{d.mts,mjs}`, matching `@reference-ui/icons`),
and the three configs importing the barrel for `baseSystem` migrated (docs,
`matrix/tests/mcp`, `matrix/tests/chain/T16`). Plus a `LoadConfigError`
upstream-sync hint, a barrel-import guard, and a packed-tarball subpath smoke.

Byte-identity: 1,258 pinned files PASS after a captain-owned **single-line**
re-baseline of `docs/.reference-ui/system/baseSystem.mjs` (comment-only esbuild
banner delta; canonical mode = dist). Evaluated spec / manifest / CSS
byte-identical.

## Follow-ups

1. **`NEO_EMIT_MODE_DRIFT`** — make fragment-bundle emission mode-independent
   (source vs dist invocation); entry `lib/microbundle/build-options.ts`.
2. R4 stays CUT; any future persistent-config-cache needs a ≥100 ms sustained
   cacheable phase and a sound key.
3. R2 (alias-force lib into the bundle) remains the filed CUT-backup only if R1
   is ever reverted.

## Verification (reproducible)

```bash
node .agents/missions/voyage-one-shot/scripts/measure-one-shot.mjs config packages/reference-docs  # bundle/evaluate/import
node .agents/missions/voyage-one-shot/scripts/run-samples.mjs sync packages/reference-docs 16      # phase split
node .agents/missions/voyage-one-shot/scripts/verify-pins.mjs                                      # identity
pnpm agent vitest packages/reference-neo/src/config && pnpm agentneo q
cd packages/reference-docs && pnpm exec ref sync                                                   # ~295 ms
```

## Tree state

Pre-existing untracked, untouched: `pipeline/src/registry/lock.ts`,
`pipeline/src/registry/lock.test.ts`,
`pipeline/src/testing/matrix/runner/paths.test.ts`. All `.reference-ui/` and
`dist/` outputs are generated/gitignored.
