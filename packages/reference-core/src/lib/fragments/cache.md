# Feature Request: Incremental Fragment Caching

**Status**: Future Consideration / Backlog  
**Category**: Performance & Watch-Mode Optimization  
**Affected Packages**: `@reference-ui/core` (`src/lib/fragments`)

---

## 1. Overview & Motivation

Currently, the fragment collector compiles and evaluates all matched fragment files on every sync/build pass:
* **Real theme scale (~30 files)**: ~26–35 ms total time.
* **Extreme stress scale (500 files)**: ~520 ms total time.

While current numbers are sub-perceptual for everyday development, repeated CLI runs (`ref sync`, CI checks) and watch-mode reload cycles could be driven down to **effectively 0 milliseconds** by caching unchanged fragment files and invalidating only dirty ones.

This document outlines the proposed design and caching mechanics if this feature is prioritized in the future.

---

## 2. Proposed Architecture

Fragment caching can be applied at two distinct layers:

```
[ User File ] 
      │
      ▼
 [ Layer 1: Bundle Cache ] ──(Cache Hit)──> Skip esbuild (~450ms saved at 500 files)
      │
      ▼
 [ Layer 2: Output Data Cache ] ──(Cache Hit)──> Skip V8 import() & eval (~60ms saved at 500 files)
      │
      ▼
[ Collectors receive cached plain JS objects ] ──> ~0ms total
```

### Layer 1: Bundled IIFE Cache (Fastest to Implement)
* **What is cached**: The string output of `microBundle(filePath)`.
* **Key**: `sha256(filePath + fileContent + systemVersion)`.
* **Storage**: In-memory `Map` during watch mode, or persisted to `.reference-ui/cache/fragments/bundles/`.
* **Win**: Bypasses esbuild entirely for unchanged files.

### Layer 2: Evaluated Fragment Data Cache (True Zero-Time)
* **What is cached**: The plain JavaScript data objects extracted by collectors for that specific file.
* **Key**: Same content hash as Layer 1.
* **Storage**: `.reference-ui/cache/fragments/data.json` or in-memory map.
* **Win**: Bypasses both esbuild and V8 `import()`. Collect phase becomes a synchronous array merge of pre-parsed JSON fragments (~1–2 ms total).

---

## 3. Invalidation Strategy

A fragment cache entry is invalidated if:
1. **Source File Modified**: The file's content hash or `mtime` changes.
2. **Upstream Config/Core Changes**: The `@reference-ui/core` package version or system aliases change.
3. **External Dependencies**: If a fragment file imports local shared constants, changes to those dependencies must propagate invalidation (can be tracked via esbuild `metafile.inputs`).

In watch mode (`ref dev`), the file watcher emits granular change events, so only the edited file's cache entry needs to be purged:

```ts
function onFileChange(changedPath: string) {
  fragmentCache.delete(changedPath)
  // Re-run collector: 499 files hit cache (0ms), 1 file re-evaluates (~3ms)
}
```

---

## 4. Why This is NOT a Current Release Gate

1. **Current Headroom is Sufficient**: Real-world design system theme folders (~30 files) already bundle and evaluate in **~26 ms** with zero React overhead.
2. **Simplicity Over Complexity**: The current in-process execution has zero cache synchronization bugs, zero stale-cache risks, and zero persistent cache file management.
3. **Trigger for Implementation**: Implement this if enterprise consumers adopt fragments across thousands of component files or request instant sub-millisecond incremental HMR in massive repositories.
