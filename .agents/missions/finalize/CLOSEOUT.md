# CLOSEOUT — finalize mission

Mission: finalize the work listed in `FINALIZATION_REPORT.md` (archived beside
this file). Branch `reference-system`. Crews ran DeepSeek V4.1 Flash
(`deepseek/deepseek-flash#high`); the captain verified firsthand and committed,
one arc per commit; every arc was reviewed by the Oracle (Muse Spark 1.3
Contributor, Max effort).

## Outcomes

| Objective | Verdict | Evidence |
| --- | --- | --- |
| O1 — land lingering verified work | **LANDED** | 3 product commits + mission layer; gates re-run by captain |
| Arc 1 — memoize external resolution | **LANDED** | `7a83e9fa7`; 8,067→19 resolutions, one-shot 20.5s→~1.9s, byte-identical |
| Arc 1 — Oracle demands F1/F3 | **LANDED** | `ecbc0139d` falsifiers (tests only); mutation-proven |
| Arc 1 — Oracle demand F2 | **FILED** | enumeration memo; deferred, residual not worth the semantic change |
| Arc 2 — tasty off the critical path | **CUT** | drain is 110–121 ms post-Arc-1; removal breaks REF-10 (`bin/ref.js` `process.exit`) |
| Arc 3 — native MDX | **NOT LANDED — plan** | cross-package (new NAPI dep + root lockfile); Oracle-approved plan in `PLAN-mdx.md` |

## Commits (base `8d8f5a710`)

```
c291cde43 chore(mission): revise Arc 3 plan per Oracle (R1/R2/R4); file as follow-up
96f017015 chore(mission): Arc 1 Oracle fixes landed (ecbc0139d)
ecbc0139d test(tasty): pin memo sharing and key-shape falsifiers
f225aca95 chore(mission): Arc 3 plan filed + Oracle review; Arc 1 fix line open
2ffb79770 chore(mission): Arc 1 review dispatched; Arc 2 CUT (110-121ms drain); open Arc 3
7ade090c6 chore(mission): record Arc 1 landing (7a83e9fa7)
7a83e9fa7 perf(tasty): memoize external import resolution per scan
291f2c633 chore(mission): record O1 landing; open Arc 1
0429dbc91 chore(agents): land finalization mission layer; archive brief
1c9b894bd docs(system): add System section and beginner Fonts guide
06f031e7b fix(neo): gate fragment matches to JS-bundleable extensions
81af69d7a fix(atomic): resolve bare weight against the active font family
```

## The headline result

`ref sync` one-shot on the docs app went from **~20.5 s to ~1.9 s** with the
tasty external-resolution memo (`7a83e9fa7`): 8,067 → 19 resolutions,
7,922 → 9 fallbacks, ~344k → 44 `package.json` attempts; output byte-identical
(492-file `diff -r`; `manifest.js` sha `51c69b1d…`).

## Oracle reviews

- **ARC1.review** — mergeable; correctness and byte-identity hold; 44-vs-19
  reads accepted as the untouched-fallback floor (P4-4); demands F1 (P2) +
  F3 (P3), both landed in `ecbc0139d`; F2 (P3) filed.
- **ARC3.review** — plan APPROVED WITH CHANGES; STOP upheld; Arc 3 stays
  NOT LANDED. Adopted R1/R2/R4; R5/R6 captain rulings (abort-with-attribution
  on compile failure; platform coverage via pnpm optionalDependencies);
  R7/R8 notes.
- Reports (gitignored): `.agents/missions/finalize/reports/*.md`.

## Follow-ups for a future mission

1. **Arc 3 native MDX** — execute `.agents/missions/finalize/PLAN-mdx.md`.
   Phase 1 (add `@rspress/mdx-rs` + root `pnpm install`) is a captain-gated
   cross-package step.
2. **F2** (`tasty` residual) — memoize installed-package enumeration / build a
   declaration-provider index once per scan; do only if the residual matters.
3. **Arc 2** — revisit only if a future corpus makes the tasty drain
   non-trivial again; must preserve the REF-10 manifest-landing contract.

## Verification commands (reproducible)

```bash
pnpm agentrs c tasty          # 90 passed
pnpm agentrs v tasty          # 83 passed
pnpm agentrs q                # 0 violations
pnpm agent vitest packages/reference-neo/src/collect/lib/scan   # 38 passed
pnpm agentdocs q              # 0 errors
pnpm --filter @reference-ui/reference-docs exec ref sync        # ~1.9s
```

## Tree state

Pre-existing untracked files, not this mission:
`pipeline/src/registry/lock.ts`, `pipeline/src/registry/lock.test.ts`,
`pipeline/src/testing/matrix/runner/paths.test.ts`. Known pre-existing test
failures to ignore: `bin/ref.test.ts` verbose-wording drift; flaky
`clean-repro` / `session-repro` lock-kill tests.
