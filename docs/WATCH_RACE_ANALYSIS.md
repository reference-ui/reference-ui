# Reference Docs Watch Race Analysis

## Summary

Yes, this issue is worth investigating.

The failure mode is not random editor noise. There is a credible race in the current sync pipeline where the reference build can scan `.reference-ui/virtual` while that directory is being torn down and rebuilt.

This matches the observed docs dev failure:

```text
failed to read .../packages/reference-docs/.reference-ui/virtual/src/components/AnimationDemo.tsx: No such file or directory
```

The source file still exists, and the virtual copy exists again immediately after the failure. That points to a transient inconsistency window, not a real missing file.

## What We Observed

The docs source file exists:

- `packages/reference-docs/src/components/AnimationDemo.tsx`

The virtual file also exists after the failure settles:

- `packages/reference-docs/.reference-ui/virtual/src/components/AnimationDemo.tsx`

The failure happens during `ref sync --watch` / docs dev, while the reference build is reading from the generated virtual tree.

## Why The Race Is Plausible

### 1. Full virtual sync deletes the whole virtual tree first

In `packages/reference-core/src/virtual/copy-all.ts`, full copy does this:

1. remove `.reference-ui/virtual`
2. recreate `.reference-ui/virtual`
3. copy matched files back into it

That means there is a real period where some or all virtual files do not exist.

### 2. Reference build scans the virtual tree through `.reference-ui`

In `packages/reference-core/src/reference/bridge/tasty-build.ts`, the Tasty scan options are built from `.reference-ui` output, including virtualized source paths.

That makes the reference build directly dependent on the current on-disk consistency of `.reference-ui/virtual`.

### 3. The event graph allows reference rebuilds from virtual change events

In `packages/reference-core/src/sync/events.ts`:

- `virtual:fs:change` triggers `run:reference:build`
- `virtual:fs:change` also triggers `run:system:config`
- the initial startup path uses `virtual:copy:complete` as a barrier, but incremental rebuilds are driven from per-file virtual events

This is efficient, but it also means the reference build is intentionally close to the virtual mutation stream.

## Most Likely Root Cause

The most likely root cause is this:

1. a full virtual copy begins
2. `.reference-ui/virtual` is removed
3. before all files are copied back, a reference rebuild or scan starts
4. Rust/Tasty tries to read a virtual file listed by the include globs
5. the file is temporarily absent and the build fails

The `AnimationDemo.tsx` error is exactly what that would look like.

## Is This Worth Fixing?

Yes.

Reasons:

- it makes local docs development flaky
- it produces confusing false-negative build errors
- it undermines trust in `ref sync --watch`
- it is likely to recur on larger or slower workspaces
- it is independent of the icons investigation, so it will keep surfacing even after icon sizing is fixed

This is the kind of defect that wastes time repeatedly because it looks like missing source, stale output, or random watch instability.

## Clear Solution Space

There is a clear solution space. The best fix is not necessarily large, but it should be implemented intentionally.

### Option A: Make full virtual copy atomic

Recommended first choice.

Instead of deleting `.reference-ui/virtual` and repopulating it in place:

1. copy into a temporary sibling directory such as `.reference-ui/virtual.next`
2. finish the full copy completely
3. atomically rename `virtual.next` to `virtual`
4. remove the old directory after swap if needed

Benefits:

- readers never see a half-populated virtual tree
- the reference build always scans a coherent snapshot
- this fixes the underlying filesystem consistency problem instead of adding timing assumptions

Tradeoffs:

- slightly more implementation complexity
- need to ensure rename semantics are handled safely on macOS/Linux
- may need careful handling if other watchers are subscribed to the old path

### Option B: Add a build barrier around full virtual copy

Good fallback or complementary fix.

Add explicit state so the reference build cannot run while a full virtual copy is in progress.

Example approach:

1. emit `virtual:copy:start` before deleting the directory
2. suppress or queue `run:reference:build` until `virtual:copy:complete`
3. trigger one reference rebuild after the copy is fully complete

Benefits:

- smaller change to orchestration than full atomic swap
- preserves current directory layout

Tradeoffs:

- still leaves an inconsistent on-disk tree during the copy
- other consumers could still observe the gap unless they also honor the barrier
- more event coordination logic and queueing rules

### Option C: Scan from a manifest/snapshot instead of live globbing the tree

Architecturally strong, but larger in scope.

Instead of asking Rust/Tasty to rescan live files from `.reference-ui/virtual`, feed it an already-built consistent file manifest or staged snapshot.

Benefits:

- avoids whole-class race conditions between writers and scanners
- could improve determinism more broadly

Tradeoffs:

- larger design change
- likely not the fastest fix for the current issue

## Recommended Path

Recommended implementation order:

1. fix the full-copy path with an atomic staged swap
2. if needed, add a small orchestration barrier so reference rebuilds only fire after the swap completes
3. keep incremental single-file sync as-is unless it shows similar instability

Why this path:

- it addresses root cause rather than hiding symptoms
- it keeps watch-mode performance characteristics mostly intact
- it reduces reliance on event timing between workers

## What Does Not Look Like The Root Cause

These are likely separate issues, not the cause of the `AnimationDemo.tsx` failure:

- Vite MDX Fast Refresh incompatibility warnings
- the icons `size` extraction/debugging work
- a real missing source file in `reference-docs`

The MDX warning causes a full page reload, but not this filesystem read failure.

## Suggested Follow-Up Tasks

1. add logging around full virtual copy start/end and reference build start
2. implement atomic staged virtual copy swap
3. add a regression test around watch-mode rebuilds during full virtual refresh
4. only if needed, add event-level gating for reference rebuild scheduling

## Relevant Files

- `packages/reference-core/src/virtual/copy-all.ts`
- `packages/reference-core/src/virtual/worker.ts`
- `packages/reference-core/src/reference/bridge/tasty-build.ts`
- `packages/reference-core/src/reference/bridge/run.ts`
- `packages/reference-core/src/sync/events.ts`
- `packages/reference-docs/src/components/AnimationDemo.tsx`

## Bottom Line

This is worth fixing.

There is a clear, defensible solution: make full virtual refresh atomic, and if needed, couple that with a stricter rebuild barrier so reference scans only run against a complete virtual snapshot.