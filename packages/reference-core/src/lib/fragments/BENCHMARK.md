# Reference UI Benchmarks: Fragment Collection & Extractor Scale

Comprehensive performance benchmarks comparing build-time fragment evaluation (`tokens()`, `font()`, `keyframes()`, `globalCss()`) against historical zero-runtime CSS-in-JS extractors (Panda CSS, WyW-in-JS / Linaria, Vanilla Extract).

- **Benchmark Runner**: `packages/reference-core/.ref/fragment-bench/run.mjs`
- **Re-run command**: `node packages/reference-core/.ref/fragment-bench/run.mjs`
- **Machine**: Apple Silicon (M-series, Node 24)

---

## 1. The 500-File Stress Workload ("The Big Boy")

All stress benchmarks use a matched high-volume enterprise workload:

* **500 individual files** $\times$ **20 styles/tokens per file** = **10,000 declarations**
* **450 token bag files** (9,000 color tokens with `oklch(...)` expressions)
* **50 motion files** (50 keyframe animation rules)
* Evaluated against real design system imports (`@reference-ui/system`)

---

## 2. Before vs. After Optimizations (500-File Stress Test)

Tested in isolated fresh Node processes to ensure 100% honest, unpolluted heap and RSS memory figures:

| Metric | Before (Sequential + Bloated Barrel) | After (Promise.all + Lean Barrel + React Stub) | Impact / Improvement |
| :--- | :---: | :---: | :---: |
| **Emitted JavaScript** | **26.39 MB** (52.8 KB/file) | **2.65 MB** (5.3 KB/file) | **10.0x code reduction** |
| **Scan Time** | 4.5 ms | 5.0 ms | Baseline I/O |
| **Bundle Time (esbuild)** | 1,977.4 ms (~2.0 s) | **540.0 ms** (~0.54 s) | **3.7x faster** |
| **Eval Time (V8 `import()`)** | 514.1 ms (~0.51 s) | **40.0 ms** | **12.8x faster** |
| **Total Wall-Clock Time** | **2,496.1 ms** (~2.50 s) | **580.0 ms** (<0.60 s) | **4.3x faster** |
| **Peak Memory RSS (Fresh Process)** | **348.5 MB** | **107.2 MB** | **241.3 MB memory saved** |
| **Incremental RSS Delta** | **+309.1 MB** | **+47.2 MB** | **6.5x leaner** |

---

## 3. All Workload Sizes (Post-Optimization)

Summary across small, medium, enterprise stress, and real production theme suites:

| Workload | Files | Items Declared | Emitted JS | Bundle Time | Eval Time | Total Time | Peak RSS |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Real `reference-lib` theme** | **30** | Theme bags & keyframes | **220 KB** (7.3 KB/f) | **19.6 ms** | **5.7 ms** | **26.0 ms** | ~63 MB |
| **Synthetic (small)** | 31 | 620 tokens | 163 KB (5.3 KB/f) | 37.3 ms | 4.7 ms | **42.3 ms** | ~69 MB |
| **Synthetic (medium)** | 200 | 4,000 tokens | 1,062 KB (5.3 KB/f) | 203.4 ms | 24.9 ms | **230.6 ms** | ~101 MB |
| **Synthetic 500 (Tokens)** | 500 | 10,000 tokens | 2,658 KB (5.3 KB/f) | 540.0 ms | 40.0 ms | **580.0 ms** | ~107 MB |
| **Synthetic 500 (With React)** | 500 | 10,000 tokens + JSX | 2,900 KB (5.8 KB/f) | 512.0 ms | 40.8 ms | **552.8 ms** | ~126 MB |

---

## 4. Comparison Against Zero-Runtime CSS-in-JS Extractors

Matched workload of **500 component files $\times$ 20 style calls = 10,000 styles**:

| Tool | Approach | Emitted JS / Scale | Peak RSS | Total Time | Notes |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **WyW-in-JS (Linaria)** | Babel AST + `node:vm` evaluation | — | **~1,580 MB** | Extremely slow | Evaluates every single style site in `node:vm`; unbounded transform cache |
| **Vanilla Extract** | Bundled `.css.ts` evaluate | — | **~600–770 MB** | Medium | CLI removed from tree |
| **Panda CSS** | TypeScript AST (`ts-morph`) | ~584 files | **~600 MB** | ~1.5–2.5 s | Builds full `ts.Program`; ASTs held in memory |
| **Reference UI Fragments** | In-memory esbuild IIFE + native ESM `import()` | **2.65 MB** | **~107 MB** | **0.58 s** | Evaluates only design tokens & declarations; atomic extract stays dumb |

---

## 5. The Core Architectural Levers

1. **Zero-Runtime React Stubbing (`reactStubPlugin`)**
   - Intercepts `react`, `react-dom`, and `react/jsx-runtime` during fragment microbundling, replacing them with a ~200-byte proxy stub covering `createElement`, `jsx`, `Fragment`, and hooks.
   - Prevents inlining 118–435 KB of React per file. Eliminates Node ESM `Dynamic require of "react" is not supported` errors. Component files can define JSX and tokens side-by-side with zero React runtime in memory.

2. **Parallel Multi-Core Bundling (`Promise.all`)**
   - Refactored `bundleFragments` from a sequential `for...of` loop to concurrent `Promise.all(files.map(...))`.
   - Directly engages esbuild's Go thread pool across all CPU cores, cutting bundling time from 1,977 ms down to 540 ms.

3. **Decoupled System Entry Barrel**
   - Extracted pure `getRhythm` arithmetic into `get-rhythm.ts`, removing the eager dependency on the rhythm extension barrel (`postcss-value-parser`, border, outline, and color utilities).
   - Drops per-file bundle size from **53 KB down to 4 KB** (a 10x reduction in emitted code across 500 files).

---

## 6. Constraints & Guidelines

* **Atomic CSS extraction stays dumb**: The extractor does regex/AST leaf scanning without JavaScript evaluation. Fragment execution is restricted to design system tokens and recipes.
* **Heavy user dependencies**: Each fragment file compiles to an isolated IIFE. If consumers import heavy third-party packages (e.g. complex color/math libraries) across 500 files, esbuild will bundle that library into each file. Fragment files should remain declarative data dumps (`tokens()`, `recipe()`). Heavy calculations should be done in a single shared module or precomputed.
