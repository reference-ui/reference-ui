kage(s) in 0.02s
ref → sync Generated runtime TypeScript declarations in 3.71s
ref → sync Built reference in 0.15s
ref → sync Built 1 package(s) in 0.02s
ref → sync Generated library TypeScript declarations in 1.33s
ref → sync Sync complete in 5.04s
[prepare] Building extend-library declarations
CLI Building entry: {"index":"src/index.ts"}
CLI Using tsconfig: tsconfig.json
CLI tsup v8.5.1
CLI Using tsup config: /Users/ryn/Developer/reference-ui/fixtures/extend-library/tsup.config.ts
CLI Target: node18
CLI Cleaning output folder
ESM Build start
ESM dist/index.mjs 950.08 KB
ESM ⚡️ Build success in 30ms
DTS Build start
DTS ⚡️ Build success in 1030ms
DTS dist/index.d.ts 1.49 KB
[prepare] Packaging extend-library
Generating sandboxes:
[prepare] Preparing sandbox react17-vite5
[prepare] Removing existing sandbox react17-vite5
[prepare] Composing sandbox react17-vite5
[prepare] Installing sandbox dependencies for react17-vite5
[prepare] Clearing generated artifacts for react17-vite5
[prepare] Running ref sync for react17-vite5
ref → sync Starting CLI
ref → config skipping styletrace root after analysis failure Styletrace analysis failed: failed to resolve local module ../browser-component/ReferenceStatus from /Users/ryn/Developer/reference-ui/packages/reference-e2e/.sandbox/react17-vite5/.reference-ui/virtual/_reference-component/ReferenceStatus.tsx
ref → sync Built 3 package(s) in 0.02s
ref → sync Generated runtime TypeScript declarations in 0.82s
ref → sync Built reference in 0.23s
ref → sync Built 1 package(s) in 0.02s
ref → sync Generated library TypeScript declarations in 0.25s
ref → sync Sync complete in 1.07s
  ✓ react17-vite5 (full)
[prepare] Preparing sandbox react18-vite5
[prepare] Removing existing sandbox react18-vite5
[prepare] Composing sandbox react18-vite5
[prepare] Installing sandbox dependencies for react18-vite5
[prepare] Clearing generated artifacts for react18-vite5
[prepare] Running ref sync for react18-vite5
ref → sync Starting CLI
ref → config skipping styletrace root after analysis failure Styletrace analysis failed: failed to resolve local module ../browser-component/ReferenceStatus from /Users/ryn/Developer/reference-ui/packages/reference-e2e/.sandbox/react18-vite5/.reference-ui/virtual/_reference-component/ReferenceStatus.tsx
ref → sync Built 3 package(s) in 0.02s
ref → sync Generated runtime TypeScript declarations in 0.89s
ref → sync Built reference in 0.23s
ref → sync Built 1 package(s) in 0.02s
ref → sync Generated library TypeScript declarations in 0.25s
ref → sync Sync complete in 1.14s
  ✓ react18-vite5 (full)
[prepare] Preparing sandbox react19-vite5
[prepare] Removing existing sandbox react19-vite5
[prepare] Composing sandbox react19-vite5
[prepare] Installing sandbox dependencies for react19-vite5
[prepare] Clearing generated artifacts for react19-vite5
[prepare] Running ref sync for react19-vite5
ref → sync Starting CLI
ref → config skipping styletrace root after analysis failure Styletrace analysis failed: failed to resolve local module ../browser-component/ReferenceStatus from /Users/ryn/Developer/reference-ui/packages/reference-e2e/.sandbox/react19-vite5/.reference-ui/virtual/_reference-component/ReferenceStatus.tsx
ref → sync Built 3 package(s) in 0.03s
ref → sync Generated runtime TypeScript declarations in 1.27s
ref → sync Built reference in 0.34s
ref → sync Built 1 package(s) in 0.03s
ref → sync Generated library TypeScript declarations in 0.36s
ref → sync Sync complete in 1.64s
  ✓ react19-vite5 (full)
[prepare] Preparing sandbox react18-webpack5
[prepare] Removing existing sandbox react18-webpack5
[prepare] Composing sandbox react18-webpack5
[prepare] Installing sandbox dependencies for react18-webpack5
[prepare] Clearing generated artifacts for react18-webpack5
[prepare] Running ref sync for react18-webpack5
ref → sync Starting CLI
ref → config skipping styletrace root after analysis failure Styletrace analysis failed: failed to resolve local module ../browser-component/ReferenceStatus from /Users/ryn/Developer/reference-ui/packages/reference-e2e/.sandbox/react18-webpack5/.reference-ui/virtual/_reference-component/ReferenceStatus.tsx
ref → sync Built 3 package(s) in 0.02s
ref → sync Generated runtime TypeScript declarations in 0.88s
ref → sync Built reference in 0.16s
ref → sync Built 1 package(s) in 0.02s
ref → sync Generated library TypeScript declarations in 0.18s
ref → sync Sync complete in 1.06s
  ✓ react18-webpack5 (full)
Sandboxes ready at /Users/ryn/Developer/reference-ui/packages/reference-e2e/.sandbox

▶ react17-vite5

▶ react18-vite5

▶ react19-vite5

▶ react18-webpack5

--
you can see this on the ci

## Findings

This does not look like an e2e-only bug.

The immediate problem is that the generated reference mirror under `.reference-ui/virtual/_reference-component` is not self-contained, and styletrace happens to be the first thing strict enough to notice.

### Confirmed root cause

`copyReferenceBrowserToVirtual()` only mirrors `packages/reference-core/src/reference/browser` into `_reference-component`.

Relevant source:

- `packages/reference-core/src/reference/bridge/copy-browser-virtual.ts`

But files inside that mirrored tree still import from the sibling `browser-component` tree, which is **not** copied alongside it.

Confirmed examples:

- `packages/reference-core/src/reference/browser/ReferenceStatus.tsx`
  - `export { ... } from '../browser-component/ReferenceStatus'`
- `packages/reference-core/src/reference/browser/components/index.ts`
  - re-exports multiple modules from `../../browser-component/components/*`

That same broken relative import is present in the generated sandbox output:

- `packages/reference-e2e/.sandbox/react18-vite5/.reference-ui/virtual/_reference-component/ReferenceStatus.tsx`

and there is no sibling `.reference-ui/virtual/browser-component` directory there to satisfy it.

So the warning is real: styletrace is walking a generated file graph that contains an unresolved local import.

### Why sync still succeeds

Styletrace is already coded to degrade gracefully here.

`traceIncludedJsxElements()` uses `Promise.allSettled()` and logs a warning when one traced root fails:

- `packages/reference-core/src/system/panda/config/styletrace.ts`

That behavior is covered by an existing unit test:

- `packages/reference-core/src/system/panda/config/styletrace.test.ts`

I also ran that focused test file locally and it passes.

So today this is a noisy robustness issue, not a hard failure:

- styletrace analysis for one root fails
- config generation continues
- `ref sync` completes
- the e2e sandboxes still prepare successfully

### Why this shows up during e2e

This is not because the fixture `include` globs are wrong.

The fixture config is the normal shape:

- `fixtures/extend-library/ui.config.ts`
  - `include: ['src/**/*.{ts,tsx}']`

The warning appears because `ref sync` itself creates `.reference-ui/virtual/_reference-component`, and styletrace follows imports far enough to encounter that generated subtree.

In other words:

- the e2e suite is exposing the bug reliably
- but the bug is in the reference virtual mirror contract, not in the test harness

### Coverage gap

The current tests assert that `_reference-component` exists, but they do not assert that it is internally resolvable after being copied.

Examples:

- `packages/reference-unit/tests/virtual/baseline.test.ts`
  - checks that a few `_reference-component/*` files exist
- `packages/reference-unit/tests/virtual/mirror.test.ts`
  - explicitly skips `_reference-component/` when checking orphan invariants

So we have presence coverage, but not self-contained graph coverage.

## Assessment

### What should actually be fixed

The primary fix should be in reference-core / virtual mirroring, not in the e2e suite.

The mirror should either:

1. copy the additional `browser-component` sources needed by `_reference-component`, or
2. rewrite those imports so everything inside `_reference-component` stays within the mirrored subtree, or
3. stop mirroring files that depend on `browser-component` and mirror a truly closed entry surface instead.

Option 2 or 3 is cleaner than copying a second partially-related tree, but the main point is that the generated virtual graph needs to be internally valid.

### What styletrace could do better

Styletrace is already graceful enough to avoid breaking CI, so I would treat styletrace changes as a secondary hardening pass, not the main fix.

Reasonable hardening options:

1. keep the current fallback but make the warning more explicit that the failure came from generated reference virtual files
2. skip tracing known generated reference mirror files if they are not supposed to contribute meaningful JSX discovery
3. if the Rust tracer can support it, downgrade unresolved local imports in generated virtual code from root-fatal to file-local

I would not rely on that alone, because it would just mask a broken virtual mirror.

## Recommendation

My read is:

- this is a real product/runtime bug in the generated reference mirror
- the e2e suite is useful here because it catches the warning consistently
- styletrace already behaves reasonably, but could be less noisy once the mirror bug is fixed

If we want one concrete next change, I would start by fixing `copyReferenceBrowserToVirtual()` or the import layout it depends on, then add a test that asserts every local relative import inside `_reference-component` resolves after copy.

---

another trace:

ref → sync Starting CLI
ref → config skipping styletrace root after analysis failure Styletrace analysis failed: failed to resolve local module ../browser-component/ReferenceStatus from /Users/ryn/Developer/reference-ui/packages/reference-e2e/.sandbox/react18-webpack5/.reference-ui/virtual/_reference-component/ReferenceStatus.tsx
ref → sync Built 3 package(s) in 0.04s
ref → sync Generated runtime TypeScript declarations in 0.83s
ref → sync Built reference in 0.21s
ref → sync Built 1 package(s) in 0.06s
ref → sync Generated library TypeScript declarations in 0.28s
ref → sync Sync complete in 1.11s