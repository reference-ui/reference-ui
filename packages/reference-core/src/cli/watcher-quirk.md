# Watcher Quirk: Vite Doesn't Watch node_modules

## The Problem

When editing user-space props (e.g. `tokens.ts`, `RecipeDemo.tsx`) in watch mode, the full pipeline runs correctly:

```
watch → copy to virtual → system compiles → packager writes to node_modules
```

But the dev server (Vite) required a **restart** to pick up the changes. The flow "should work" but didn't.

## The Cause

**Vite does not watch `node_modules`.** It's in the default `server.watch.ignored` list for good reason (performance, most deps are static). So when the packager writes updated bundles to `node_modules/@reference-ui/react` and `node_modules/@reference-ui/system`, Vite never sees those file changes. It keeps serving whatever it cached at startup.

## The Fix

Output packages to a **watched** path instead of `node_modules`, then symlink so imports still resolve correctly:

1. **Write to `cwd/.reference-ui/<pkg>/`** — e.g. `.reference-ui/react/`, `.reference-ui/system/`
2. **Symlink `node_modules/@reference-ui/<pkg>` → `.reference-ui/<pkg>`**
3. Vite watches the project root (including `.reference-ui/`), so when we overwrite `.reference-ui/react/react.js` or `styles.css`, the watcher fires
4. Those files are in the module graph (imported via `@reference-ui/react`), so HMR triggers

Module resolution: `import '@reference-ui/react'` → Node follows the symlink → resolves to the real path under `.reference-ui/react/`. Vite's watcher follows symlinks too, so it sees the actual files. When we write to them, HMR works.

## Implementation

- `packages/reference-core/src/cli/packager/bundler.ts`: `bundleAllPackages()` now writes to `.reference-ui/<shortname>/` and creates symlinks from `node_modules/@reference-ui/<shortname>`
- `.gitignore`: Added `.reference-ui` so generated output isn't committed

## Why It Feels Like WTF

1. **The pipeline was correct** — everything ran in the right order
2. **The output was correct** — bundles landed in node_modules as expected
3. **But Vite never looked** — its watcher explicitly ignores that directory
4. **The fix is indirection** — we don't change what Vite watches; we change *where* the files live so they end up somewhere Vite already watches

It's one of those "the tool is doing what it says, you just didn't realize what it wasn't doing" situations.

---

## Cross-Platform Sturdy-ness

**macOS / Linux:** Solid. `symlinkSync(..., 'dir')` works without special permissions.

**Windows:** `symlinkSync(..., 'dir')` requires Developer Mode or Administrator; otherwise `EPERM`. Junctions work without elevation.

**We use [`symlink-dir`](https://github.com/pnpm/symlink-dir)** — a small, cross-platform utility that automatically falls back to junctions on Windows when symlinks aren't allowed. Handles this for us; no custom logic needed.

**Vite watcher:** Chokidar follows symlinks by default; junctions appear as directories. Works on all platforms once the link exists.
