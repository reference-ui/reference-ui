# One-shot `ref sync` is config-load-bound (JS), not compiler-bound (Rust)

Status: diagnosed 2026-10-07 (finalize mission aftermath). Fix not landed.
Owner surface: `packages/reference-neo/src/config/**` + `@reference-ui/lib`
entry points.

## Symptom

After the tasty memoization fix (`7a83e9fa7`), a one-shot `ref sync` on the
docs app reports `ready in ~1.9s`. Where the time actually goes is the
surprise: it is **not** codegen/CSS and **not** tasty.

## Phase split (docs app, `REFERENCE_UI_PHASES_OUT`, steady state)

Two consecutive runs, phases from `packages/reference-neo/src/sync/phases.ts`:

| phase | run A | run B | what it is |
| --- | ---: | ---: | --- |
| **config** | 1647 ms | 1595 ms | `loadUserConfig` |
| scan | 14.6 | 13.7 | fragment discovery |
| evaluate | 10.7 | 9.7 | evaluate fragments |
| compile | 48.4 | 44.3 | native CSS codegen (Rust) |
| publish | 49.1 | 44.3 | assemble + commit |
| residual | 2.6 | 2.5 | stage rmdir / gaps |
| **atomic `sync()`** | **1772** | **1709** | |
| tasty drain | 135 | 115 | tasty rebuild |

The first process of a session is cold: `config 4267 ms`, `compile 114 ms`,
`drain 209 ms` — per-process module warmup, not the steady state.

So: **~93% of `sync()` is the config phase.** The actual codegen + CSS
(`evaluate` + `compile` + `publish`) is **~100 ms**.

## Root cause: config evaluation imports the `@reference-ui/lib` barrel

`loadUserConfig` (`packages/reference-neo/src/config/load.ts:39-61`) does two
things, timed directly:

| step | cost |
| --- | ---: |
| `bundleConfigWithDependencies` (esbuild bundle of `ui.config.ts`) | **14 ms** |
| `evaluateConfig` — Node `import()` of the 4.8 KB bundle | **~1.5–1.6 s** |

The bundle is tiny (12 dep inputs, 4834 bytes) and leaves package imports
external, so the cost is Node evaluating what the config imports. Isolated,
fresh-process:

| import | cost |
| --- | ---: |
| `import('@reference-ui/neo')` | **5 ms** |
| `import('@reference-ui/lib')` | **1597 / 1500 / 1514 ms** |

The docs config is:

```ts
import { defineConfig } from '@reference-ui/neo'
import { baseSystem } from '@reference-ui/lib'   // ← drags the whole lib graph
```

`@reference-ui/lib`'s barrel (`dist/index.mjs`, `main`/`.` export) re-exports
the entire library. Node evaluates that whole module graph to obtain one value
(`baseSystem`), which itself lives at
`packages/reference-lib/.reference-ui/system/baseSystem.mjs` (listed in the
package's `files`, but with **no `exports` subpath** to reach it directly).
`sideEffects: false` helps bundlers, not Node's ESM barrel evaluation.

## It is entirely TypeScript/Node

Zero Rust in the config phase. The Rust work in `sync()` is the separate
`compile` phase (~45 ms) plus the tasty drain (~0.12 s). The report's
"atomic codegen/CSS path is fine at ~1 s" was mis-attributed: the atomic path
is JS config-load-bound, and the compiler is ~45 ms.

## Perf-index coverage

`pnpm agentperf search startup` → **0 hits**; `config` → 2 (unrelated). New
ground; a voyage on this axis is not re-litigating anything.

## Candidate routes (to be ranked by the Oracle, not a decision)

1. **Light `baseSystem` entry.** Add an `exports` subpath for
   `baseSystem` (e.g. `@reference-ui/lib/base-system`) and have configs import
   it instead of the barrel; or expose `baseSystem` from a dependency-free
   module. Removes the lib graph from config load.
2. **Stop externalizing `@reference-ui/lib` in the config bundle.** Let esbuild
   tree-shake the config's imports (honor `sideEffects: false`) so only
   `baseSystem` lands in the bundle — trades bundle time for evaluate time.
3. **Serialize `baseSystem`.** Precompute the extends payload once and have
   config evaluation deserialize data instead of executing the lib graph.
4. **Cache the evaluated config** across one-shot processes (persist the
   validated config keyed by config + dependency mtimes), mirroring the tasty
   once-guard.
5. **Cheaper config evaluation** (e.g. `vm`/data-URL vs disk `import()`,
   avoiding a second copy of React/lib in the graph).

Each route needs a falsification bar and byte-identity against the current
config load.

## Repro

```bash
# phase split
cd packages/reference-docs && rm -rf .reference-ui/types/tasty
REFERENCE_UI_PHASES_OUT=/tmp/phases.json node <measure-script importing
  dist/src/sync/index.js, dist/src/reference/bridge/init.js, dist/src/sync/phases.js>
# import isolation (fresh process each)
cd packages/reference-docs && node --input-type=module -e \
  "const t=performance.now(); await import('@reference-ui/lib'); console.log(performance.now()-t)"
```
