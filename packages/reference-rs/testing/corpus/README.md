# Corpus termination

Runs the three walkers over real trees, each run in a child process. The other suites use small inputs, so this one covers declaration packages a Reference UI app loads, the TypeScript lib declarations, and reference-lib's own source. Each run goes through `runIsolated`, so a hang or a crash ends as a reported outcome rather than a dead Vitest worker, and a run that exceeds its budget fails with the measured time.

## Where the corpora come from

Each corpus root is resolved with `createRequire` from the first workspace package that installs it. The repo root is tried first, then reference-rs, reference-core, reference-lib and reference-docs. zod and `@tanstack/react-router` are installed only under reference-docs, and `@types/react` and `csstype` only under reference-rs, so the list falls through to them.

reference-lib `src` has one declaration file, so its tasty corpus is its `.ts` and `.tsx` source rather than `.d.ts`.

TypeScript 7 ships no `lib.*.d.ts` inside the `typescript` package. Its lib declarations sit in the platform package beside the native compiler, so the `typescript lib` corpus is `@typescript/typescript-<platform>-<arch>/lib`, resolved from `typescript`. `@types/node` has no exports at its root (its declarations are ambient `declare module` blocks), and the TypeScript lib declarations are ambient globals, so neither can be imported by a probe.

## The three checks

**Tasty display walks.** For each declaration corpus the child builds tasty with `buildTasty`, then calls `getDisplayResult` on every symbol in the manifest. `getDisplayMembers()` returns that same walk's `members`; `getDisplayResult` also reports whether a step budget or the depth guard cut the walk short, and the notices it raised. A corpus passes when every walk finishes untruncated, no notice is raised, the slowest symbol stays under 150 ms, and the corpus still holds about half its measured symbol count, so a moved or emptied tree fails.

**Styletrace probes.** Each probe is a folder written at test time. It holds `src/probe.tsx`, which imports the corpus's exported components (value exports) or types (type exports), and the corpus linked where the import resolves (`node_modules/<package>`, or `src/reference-lib` for reference-lib). Each value export gets a wrapper that forwards its StyleProps into the export; each type export becomes the props type of a wrapper, so the real declaration sits in the wrapper's props. A `WrapDiv` control forwards into `Div`, and the probe fails unless that control is traced. The probe also fails if a type-expansion guard (`STT-W-TYPE-EXPANSION-LIMIT`) or a refusal (`STT-E-*`) fires. The reference-lib probe links a folder inside `src`, so styletrace reads that tree as source, which is why it costs far more than the package probes. The probe folder is resolved with `realpath` first, since the walkers count a linked `/var` root differently from `/private/var`.

**Atlas over reference-lib.** `analyzeDetailed` runs over the reference-lib package root, not `src`: the `src` folder alone analyzes to no components, while the package root analyzes to 526. The run must find at least 250 components and report no `ATL-E-*` scan error.

The tasty child's driver is generated into the same temporary directory as its output, and the parent removes that directory after the run. A killed child never cleans up after itself, so the parent owns the directory.

## Budgets and measured numbers

Measured on this machine (x86_64 macOS, this worktree's `dist`), before the budgets were set:

| Corpus | Symbols | Walk total | Slowest symbol |
| --- | --- | --- | --- |
| `@types/react` | 372 | 192 ms | 2 ms |
| `@types/node` | 79 | about 0.9 to 1.2 s (build-dominated) | 1 ms |
| `csstype` | 718 | 744 ms | 22 ms |
| `typescript` lib (platform package) | 3028 | 2.97 s | 9 ms |
| `zod` | 1982 | 1.13 s | 8 ms |
| `@tanstack/react-router` | 151 | 203 ms | 1 ms |
| reference-lib `src` | 636 | 1.09 s | 4 ms |

Styletrace probes take about 50 ms each in a child, and the reference-lib probe about 650 ms. Atlas over the reference-lib root takes about 1.5 s, finds 526 components, and reports 44 warnings and no errors.

The budgets are fixed ceilings sitting roughly five to ten times those numbers: 15 s per tasty corpus, 150 ms per symbol, 5 s per styletrace probe, and 15 s for atlas. Each child also gets a kill timeout (60 s for tasty and atlas, 30 s for styletrace) that ends the run before the budget is judged.

## Running it

`pnpm agentrs v corpus` runs this project alone. `pnpm agentrs t` runs every vitest project, so it includes this one through the root `vitest.config.ts`. The whole suite takes about 9 s of test time.
