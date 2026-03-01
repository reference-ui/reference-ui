# CLI Release Roadmap

> Current state: performant, event-driven, ~100mb overhead vs Panda CSS baseline. Fast cold sync, fast incremental. Architecture is solid.
>
> Goal: sensibly good, not perfect. Ship something real humans can use without it blowing up.

---

## Where We Are

The full pipeline works end-to-end:

```
ui.config.ts → virtual fs → system/panda → packager → node_modules/@reference-ui/*
```

Watch mode is incremental and correct. Thread pool is tuned. HMR via `.reference-ui/` + symlinks works. Event bus keeps everything decoupled. Memory overhead is acceptable.

What's not wired: graceful shutdown, temp cleanup, cross-platform NAPI builds, user-facing error quality.

---

## Ship Criteria

These are the things that need to be done before anyone else touches it.

### 1. Graceful Shutdown — **blocking**

`shutdown()` exists in the thread pool but SIGINT/SIGTERM never call it. Ctrl+C in watch mode leaves orphaned workers and open file handles.

- Wire SIGINT + SIGTERM in `sync/index.ts` → call `shutdown()`
- Pool drains, watchers close, process exits cleanly
- Without this: every watch session leaks processes

**Files**: [sync/index.ts](sync/index.ts), [thread-pool/index.ts](thread-pool/index.ts)

---

### 2. Temp File Cleanup — **blocking**

Several workers `mkdtempSync()` and never clean up on crash. After a few bad runs, `/tmp` is littered.

Wrap every temp dir in `try/finally { rmSync(tmpDir, { recursive: true, force: true }) }`.

**Files**:

- [packager-ts/run.ts](packager-ts/run.ts)
- [lib/microbundle.ts](lib/microbundle.ts)
- [system/eval/runner.ts](system/eval/runner.ts)
- [system/collectors/runCollectScript.ts](system/collectors/runCollectScript.ts)

---

### 3. Error Messages — **blocking**

Right now errors surface as raw stack traces or silent failures. Users need to know:

- Config failed to load → what was wrong and in which file
- System eval failed → which component, what the error was
- Packager failed → why (missing entry? esbuild error?)

This does not need to be beautiful. It needs to be readable. One-line error + relevant file path is enough. Use `log.error` consistently. Don't swallow.

---

### 4. NAPI: darwin-arm64 Binary — **blocking for Apple Silicon users**

The loader already handles the platform map. The `.node` file for `darwin-arm64` just doesn't exist yet. Anyone on Apple Silicon (M1/M2/M3) falls through to the JS fallback silently, which is fine — but we should ship the native binary for the most common dev machine.

The JS fallback keeps it from being a hard crash. The missing binary is just a perf gap, not a correctness issue. Still: if you're building a tool for Mac-first devs, ship the arm64 binary.

```
virtual-native.darwin-x64.node   ← exists
virtual-native.darwin-arm64.node ← needs build
```

Run `napi build --platform --release --target aarch64-apple-darwin` once, commit the `.node` file.

**Linux + Windows binaries can wait for post-release** — covered below.

---

### 5. Token Isolation — **blocking**

Shipping a design system that dumps tokens into user token space without consent is rude and very hard to undo once people have built on top of it. This needs a position before v1, not after.

**The problem:** Reference UI has its own design tokens — colour scales, spacing, type scales, font faces. These live in Panda's token space. If a user has their own colour tokens, the overlap is unpredictable and potentially breaking. They may not want our red scale. They may not want 11 shades of anything. They definitely shouldn't be forced to.

**The position:**

Reference UI tokens are opt-in. By default, none of our tokens pollute the user's token space. Components reference our tokens via a scoped prefix or theme layer.

```ts
// ui.config.ts
export default defineConfig({
  // Default: false — our tokens exist only as a component theme, not in user space
  useReferenceTokens: false,

  // true: merge our full token scale into the user's Panda config (red.400, etc.)
  // use this if you want to build with our design language directly
  useReferenceTokens: true,
})
```

---

## Should-Have (Quality, Not Blocking)

These don't prevent a first release but will cause friction quickly without them.

### CLI Package Split (`reference-cli`)

`src/cli/` should live in its own package (`reference-cli`) that `reference-core` depends on. This is already implied by the self-building CLI design in [SELF_BUILDING_CLI.md](../../docs/SELF_BUILDING_CLI.md) — the CLI builds itself, so the separation is natural.

**Why it matters for v1:**

- Code-splitting falls out naturally. Today tsup bundles everything together. With a separate package, the CLI tree is isolated and `reference-core`'s public API surface is uncontaminated by build-time internals.
- Users get `@reference-ui/core` (the runtime) without dragging in esbuild, piscina, microbundle, and the full worker tree.
- The self-build command (`ref build`) becomes a clean binary from `reference-cli` that `reference-core/package.json` invokes — no circular awkwardness.
- Makes versioning simpler: CLI can iterate independently of the core runtime.

**Shape:**

```
packages/
  reference-cli/     ← new package, src/cli/ moves here
    src/
    dist/
    package.json     ← bin: { ref: ./dist/index.mjs }
  reference-core/    ← depends on reference-cli in devDependencies
    src/             ← styled/, api/, system/ only — no cli/ subfolder
    package.json     ← build: tsup && ref build
```

**Not strictly blocking**, but the longer this waits the messier the extraction becomes. If `src/cli/` grows more cross-references into core internals, the split gets harder. Better to do it while the seam is still clean.

---

### Config File Change Detection

When `ui.config.ts` changes during watch mode, the CLI should detect it and re-bootstrap rather than requiring a full restart. Currently it requires `Ctrl+C` + `ref sync --watch` again.

This is user-visible roughness. Not a crash, but annoying.

---

---

### Duplicate Packager Runs

Packager fires twice per change (once per Panda process). Debounce or gate on `onceAll` to collapse into one. Already analysed in [optimise.md](optimise.md).

---

### Bundler Compatibility: Vite, Webpack 5, Next.js

The output is a standard npm package so module resolution works everywhere. The real risk is HMR — each bundler has different watcher and module graph behaviour. Needs a deliberate pass against each target, not just assuming it works.

**Top 3 for release:**

| Bundler             | Priority            | Notes                                                                       |
| ------------------- | ------------------- | --------------------------------------------------------------------------- |
| Vite                | v1 — already tested | HMR via `.reference-ui/` + symlinks works                                   |
| Webpack 5           | v1 — needs a pass   | Most common in existing large codebases, different watcher behaviour        |
| Next.js (Turbopack) | v1 — needs a pass   | People are moving here fast; Turbopack doesn't follow symlinks the same way |

rspack is a nice-to-have but wait for user signal.

**What to test in each**: cold sync installs correctly, watch mode file changes trigger HMR, CSS updates propagate, no stale module cache.

**Config extension**: once we know what breaks per-bundler, expose a `bundler` key in `ui.config.ts` for any necessary workarounds (e.g. disabling symlinks for bundlers that don't follow them, explicit output path overrides). Don't add the config option speculatively — add it when a specific bundler needs it.

---

## Your Three Questions

### Is the NAPI / virtual FS truly cross-platform?

**Short answer: yes, with caveats.**

The loader ([virtual/native/loader.ts](virtual/native/loader.ts)) already handles graceful degradation. If no `.node` file exists for the current platform, it returns `null` and callers use the JS fallback. This is correct behaviour — the JS transforms are functionally identical, just slightly slower.

What's actually shipped right now:

- `darwin-x64` → native ✅
- `darwin-arm64` → JS fallback (binary not built yet)
- `linux-x64-gnu` → JS fallback (binary not built)
- `win32-x64-msvc` → JS fallback (binary not built)

Symlinks use `symlink-dir` which already falls back to junctions on Windows — that concern is handled.

**For v1**: build `darwin-arm64`. Leave Linux + Windows as post-release, JS fallback covers them.

**For post-v1**: set up napi-rs GitHub Actions cross-compilation matrix. It's a single workflow file, gives you all four targets automatically on CI.

---

### Should users have more control over how Reference UI gets packaged?

**Not yet.**

Sensible defaults are a feature. The two-package output (`@reference-ui/system`, `@reference-ui/react`) covers the right split and the entry points are well-defined. Adding packaging options before you know what users actually want to change is speculative complexity.

The right time to add config options is when a real user has a real need you can't meet with defaults. Ship first, extend later.

If it comes up: the natural extension point is `ui.config.ts` under a `packager` key — something like custom output paths or additional entry points. But hold off.

---

### Should we test in more bundler environments?

**Yes — Vite, Webpack 5, and Next.js are all in-scope for release.**

This is no longer deferred. The output is a standard npm package and module resolution is mostly fine everywhere, but HMR behaviour diverges meaningfully between bundlers. Webpack 5 has the largest installed base in existing projects. Next.js/Turbopack is where new projects are going.

See the Should-Have section above for the breakdown. The config extension (`bundler` key in `ui.config.ts`) gets added reactively — only when a specific bundler integration actually needs it, not speculatively.

---

## Post-Release Backlog

Not blocking. Do when there's runway.

| Item                                              | Why                                          |
| ------------------------------------------------- | -------------------------------------------- |
| NAPI binaries for Linux (x64 + arm64) and Windows | CI cross-compile via napi-rs actions         |
| Config file hot-reload in watch mode              | Quality of life                              |
| rspack compatibility pass                         | After Webpack 5 work lands, low delta        |
| Packager deduplication (single run per change)    | ~38ms + downstream waste                     |
| Hot path routing in system worker                 | ~400ms on non-config changes                 |
| `--debug` CLI flag                                | Instead of requiring `debug: true` in config |
| `ref check` command                               | Type-check without full sync, fast feedback  |

---

## What To Do Next

**This week**: graceful shutdown + temp cleanup. Both are small, both matter.

**Then**: error messages pass (read through each failure path, make them human).

**Then**: token isolation — design the three modes, update `createPandaConfig`, verify components work scoped. This is the highest-risk decision; do it before any external users touch it.

**Then**: darwin-arm64 binary + minimal user README.

**Alongside (if bandwidth)**: start the `reference-cli` package extraction — move `src/cli/` to its own package while the seam is still clean.

**That's v1.** Everything else is after.
