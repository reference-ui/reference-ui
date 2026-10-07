# MEASURE.md — voyage-one-shot baseline (Wave 0)

Baseline proof for the one-shot `ref sync` startup voyage. **Recon only — no
product code changed.** All numbers below are fresh-process, bench-locked
(`/tmp/swarm-bench-lock` held by `wave0-recon` for the whole timed session).

- Tip / pin: `reference-system` @ `50df627bd` (product tree identical to
  `c5fba023c`; `50df627bd` changed mission docs only).
- Harness: `.agents/missions/voyage-one-shot/scripts/measure-one-shot.mjs`
  (both modes), driven by `run-samples.mjs` for N fresh processes.
- Target: `packages/reference-docs` (`ui.config.ts` imports the
  `@reference-ui/lib` barrel for `baseSystem`).

## 1. Baseline phase split — docs `sync` mode

```bash
# 8 pairs of fresh-process samples (16 runs); each process runs sync() + tasty drain
node .agents/missions/voyage-one-shot/scripts/run-samples.mjs sync packages/reference-docs 16
```

Per-phase medians over 16 samples (ms):

| phase | median | min | max | agreement (±5%) |
| --- | ---: | ---: | ---: | --- |
| **config** | **1548** | 1513 | 4099 | 12/16 |
| scan | 14 | 14 | 34 | 12/16 |
| evaluate | 10 | 10 | 16 | 14/16 |
| compile | 45 | 44 | 71 | 13/16 |
| publish | 47 | 45 | 90 | 13/16 |
| syncResidual | 3 | 2 | 6 | 0/16 |
| **syncTotal** (`atomicMs`) | **1673** | 1634 | 4244 | 12/16 |
| **drainMs** (tasty) | **136** | 130 | 261 | 13/16 |

- Config is **92.5%** of `syncTotal` (1548 / 1673).
- One sample carried a ~4.1 s config spike (`config 4099`, `syncTotal 4244`) —
  likely GC/memory jitter; it sets the max and is why agreement is 12/16.
  Drop-max medians: config **1542**, syncTotal **1661**.
- Median of the 8 pair-means is 1611 (outlier-skewed); the 16-sample median
  **1548 ms** is the headline.
- Raw samples: `/tmp/voyage-sync-16.json`.

### Cold arm (disclosed separately)

```bash
rm -rf packages/reference-docs/.reference-ui/types/tasty packages/reference-docs/.reference-ui/tmp
node .agents/missions/voyage-one-shot/scripts/measure-one-shot.mjs sync packages/reference-docs
```

| phase | cold arm | warm median |
| --- | ---: | ---: |
| config | 1539 | 1548 |
| scan | 28 | 14 |
| evaluate | 10 | 10 |
| compile | 86 | 45 |
| publish | 56 | 47 |
| syncTotal | 1725 | 1673 |
| drain | 194 | 136 |

**Caveat:** the bug report's session-cold value is `config 4267 ms`; this arm
did **not** reproduce it. OS page-cache eviction (`purge`) needs root and no
passwordless sudo is available on this box, so only project-local caches
(`types/tasty`, `tmp`) could be dropped. This arm is "first process after a
project-cache drop", not "after a page-cache drop". The config phase is
page-cache-warm here; the cold/warm delta in the bug is attributed to page
cache, which this wave could not force.

## 2. Config mode (bundle vs evaluate vs import)

```bash
node .agents/missions/voyage-one-shot/scripts/run-samples.mjs config packages/reference-docs 8
```

Medians over 8 fresh processes:

| field | median | min | max | agreement |
| --- | ---: | ---: | ---: | --- |
| `bundleMs` (esbuild) | 13 | 13 | 14 | 5/8 |
| `evaluateMs` (Node `import()`) | **1535** | 1510 | 1567 | 8/8 |
| `depInputs` | 12 | 12 | 12 | 8/8 |
| `codeBytes` (bundle) | 4834 | 4834 | 4834 | 8/8 |
| `importNeoMs` (fresh) | 4 | 4 | 4 | 8/8 |
| `importLibMs` (fresh barrel) | **1549** | 1534 | 1599 | 8/8 |

`evaluateMs ≈ importLibMs` (1535 vs 1549): the entire config phase is Node
evaluating the `@reference-ui/lib` barrel graph. Bundle is 13 ms / 4.8 KB.

**Existence proof (already-shipped pattern):** the lib package's *own* config
imports `@reference-ui/icons/baseSystem` (a zero-import subpath), and its
self-sync config phase is **18 ms**; icons' self-sync config phase is **19 ms**
— vs docs' 1548 ms. Same one-shot machinery, different import.

## 3. Module-load census (counts-first falsification bar)

**Method.** A throwaway ESM loader (`scripts/census/`) registered with
`node --import .../register.mjs` appends every `file:` URL to a log from its
`load` hook. The runner bundles the real docs `ui.config.ts` exactly as
`loadUserConfig` does, records the log length, `evaluateConfig`s the bundle,
then attributes the loads after that slice point by package. Setup loads (neo,
esbuild) fall before the slice and are excluded. No repo dependency added.

```bash
CENSUS_OUT=/tmp/voyage-census.log node --import \
  .agents/missions/voyage-one-shot/scripts/census/register.mjs \
  .agents/missions/voyage-one-shot/scripts/census/run.mjs \
  packages/reference-docs config .agents/missions/voyage-one-shot/reports/census-docs.json
```

**Total: 7,728 file loads** (7,728 unique modules) during the docs config
import. Per-package table:

| package | loads | share | notes |
| --- | ---: | ---: | --- |
| `@reference-ui/icons` | 3860 | 49.9% | 3857 generated `dist/generated/*.mjs` + `index.mjs` + `createIcon.mjs` + `runtime/.../react.mjs` |
| `@material-symbols-svg/react` | 3859 | 49.9% | 3857 `dist/icons/*.js` + 2 core |
| `zustand` | 3 | 0.04% | esm index/react/vanilla |
| `@reference-ui/lib` | 2 | 0.03% | `dist/index.mjs` (4.1 MB barrel) + `runtime/.../react.mjs` |
| `react` | 2 | 0.03% | `index.js`, `jsx-runtime.js` |
| `react-dom` | 1 | 0.01% | `index.js` |
| `@reference-ui/docs` | 1 | 0.01% | the temp `config.bundle.mjs` |
| **total** | **7728** | 100% | |

- The two icon packages are **99.85%** of all config-import loads (7719/7728).
- Oracle prediction ~7.7k CONFIRMED; top-package attribution now proven:
  icons fan-out, not the 4.1 MB barrel parse (the barrel is **2 loads**).
- One nuance: the icons barrel re-exports **3857** generated modules, but
  `dist/generated/` holds **3858** `.mjs` — `generated/index.mjs` is an orphan
  not re-exported, so it never loads. Oracle's "~3,858 generated" is one high.
- **Boundary of the method:** only ESM `load` hooks are counted. Nested CJS
  `require()` chains inside `react`/`react-dom` are not counted (react shows as
  2 ESM records). The dominant graph is ESM, so this does not move the verdict.
- Evidence: `reports/census-docs.json` + `reports/census-docs.json.urls.txt`
  (all 7,728 URLs).

**R1 target:** after `@reference-ui/lib/baseSystem` replaces the barrel import,
the config-import graph should collapse to **~2 loads** (the temp config bundle
+ the 512 KB zero-import baseSystem payload).

## 4. Byte-identity pins

Pins live at `.agents/missions/voyage-one-shot/pins/baseline.sha256`
(details in `pins/README`). Verify with:

```bash
node .agents/missions/voyage-one-shot/scripts/verify-pins.mjs
# PASS — 1258 pinned files byte-identical (docs+lib+icons)
```

| label | `.reference-ui/` files | aggregate sha256 | command |
| --- | ---: | --- | --- |
| docs | 522 | `cfbf75c3fe7cf36e9eb86d6c3f8578c88b5f46900b781212e9db427cb2836d06` | `measure-one-shot.mjs sync packages/reference-docs` |
| lib | 580 | `85169ba54ed854e5149107cd20ae9e6779fc1f8313d02456f17aa46226627b66` | `measure-one-shot.mjs sync packages/reference-lib` |
| icons | 156 | `c8f0d68b040d1d0db35c110880e989db4646b3e6e17394149a521e2bc823cc97` | `measure-one-shot.mjs sync packages/reference-icons` |

- Manifest + CSS + `types/`, `system/`, `react/`, `styled/` all covered;
  transient `.reference-ui/tmp/` excluded.
- Determinism proven: docs identical across 18 consecutive syncs; lib and icons
  identical across two consecutive fresh self-syncs.
- **Stale-dir disclosure:** the pre-existing lib/icons `.reference-ui/` dirs on
  disk were stale. A fresh self-sync changed lib
  `system/baseSystem.mjs`, `types/types.mjs`, `react/react.mjs`,
  `react/react.mjs.map` and icons `system/baseSystem.mjs`, `types/types.mjs`.
  The pins are the **fresh self-sync** bytes, not the stale dirs.

## 5. The before-numbers R1 must beat

| bar | before | R1 must |
| --- | --- | --- |
| config-import module loads | **7,728** | ~2 |
| docs config phase | **1548 ms** median (1542 drop-max) | Oracle expects ~10–30 ms |
| docs `syncTotal` | **1673 ms** median | drop by ≥15 ms and ≥1.5% (LAND bar); R1 should clear by ~100× |
| `evaluateMs` | **1535 ms** | ~1 read+parse of 512 KB |
| byte-identity | pins above | unchanged (docs + lib + icons) |

## 6. Perf index

`pnpm agentperf search startup` → **0 hits** (109 entries, index built
2026-09-30); `pnpm agentperf search config` → 2 unrelated Rust `sync()`
entries (ASMFMT CUT, EXTEND BANK). The one-shot startup axis is new ground; no
prior verdict is re-litigated.

## 7. Disclosures

- **No product code changed.** New files are mission-local harness only:
  `scripts/census/{hooks,register,run}.mjs`, `scripts/run-samples.mjs`,
  `scripts/capture-pins.mjs`, `scripts/verify-pins.mjs`, `pins/*`, `MEASURE.md`,
  `reports/*`.
- **Tree moved mid-wave (not by me):** HEAD advanced `c5fba023c → 50df627bd`
  at 21:09:29 during recon; that commit touched mission docs only, product tree
  unchanged. Numbers are valid at both.
- **Pre-existing untracked, untouched:** `pipeline/src/registry/lock.test.ts`,
  `pipeline/src/registry/lock.ts`,
  `pipeline/src/testing/matrix/runner/paths.test.ts`.
- No commit, no push, no `git stash`.
- Bench lock acquired at session start; released in two steps at the end.
