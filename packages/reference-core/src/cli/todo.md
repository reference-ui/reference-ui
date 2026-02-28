# CLI TODO

Outstanding work to finalize the CLI. Organized by priority.

---

## High Priority

### 1. Graceful Shutdown

**Status**: `shutdown()` function exists in thread-pool but not wired up to process signals.

**What's needed**:

- Add SIGINT/SIGTERM handlers in `index.ts` or `sync/index.ts`
- Call `shutdown()` on process exit to clean up workers
- Ensure watch-mode processes terminate cleanly

**Why**: Prevents orphaned worker threads and cleans up file watchers.

**Files**: [index.ts](index.ts), [thread-pool/index.ts](thread-pool/index.ts)

---

### 2. Temp File Cleanup

**Status**: Multiple places use `mkdtempSync()` without cleanup on error.

**What's needed**: Wrap temp file operations in `try/finally` blocks:

```typescript
const tmpDir = mkdtempSync(join(tmpdir(), 'ref-'))
try {
  // work
} finally {
  rmSync(tmpDir, { recursive: true, force: true })
}
```

**Why**: Prevents accumulation of temp files in `/tmp` after crashes.

**Files**:

- [packager-ts/compiler.ts](packager-ts/compiler.ts)
- [lib/microbundle.ts](lib/microbundle.ts)
- [system/eval/runner.ts](system/eval/runner.ts)
- [system/collectors/runCollectScript.ts](system/collectors/runCollectScript.ts)

---

### 3. Public Build-Time API

**Status**: Design token functions (`tokens()`, `keyframes()`, `font()`) exist but aren't exposed as public API.

**What's needed**:

- Create proper entry point for `@reference-ui/system` that exports build-time utilities
- Update eval system to monitor virtual filesystem for calls to these functions
- Ensure functions work in user code, not just internal config files

**Why**: Users need to define custom tokens, animations, and fonts in their code.

**Files**: [system/index.ts](system/index.ts), [system/eval/](system/eval/)

---

## Medium Priority

### 4. Config-Aware Install

**Status**: `installPackages()` doesn't receive user config, limiting customization.

**What's needed**:

- Pass `ReferenceUIConfig` to install functions
- Allow config to specify custom output paths or package scopes
- Enable/disable symlinks based on config

**Why**: Different projects may need different install strategies.

**Files**: [packager/install/](packager/install/), [packager/worker.ts](packager/worker.ts)

---

### 5. Skip Config Rebuild for Non-Styled Files

**Status**: Every file change triggers full config recompilation (~121ms wasted).

**What's needed**: In `system/worker.ts`, check if changed file is in `src/styled/` before rebuilding config:

```typescript
on('virtual:fs:change', payload => {
  if (payload.path.includes('/src/styled/') || payload.path.includes('tokens.ts')) {
    await runConfigOnly(payload)
  }
  // Panda still runs (handles its own incremental updates)
})
```

**Why**: 90% of file changes don't affect design tokens. Saves ~400ms on typical edits.

**Files**: [system/worker.ts](system/worker.ts)

**Reference**: [optimise.md](optimise.md) — Problem 1

---

### 6. Cache packager-ts Outputs

**Status**: Type generation runs every build (~441ms), even when inputs unchanged.

**What's needed**:

- Hash input files (bundled packages)
- Hash output files (generated .d.ts)
- Skip `compileDeclarations()` if hashes unchanged

**Why**: Saves ~440ms on incremental builds with no TS changes.

**Files**: [packager-ts/index.ts](packager-ts/index.ts), new `lib/hash.ts`

**Reference**: [optimise.md](optimise.md) — Problem 4

---

## Low Priority

### 7. Merge Scripts and CLI

**Status**: Build scripts and CLI are separate. Users install pre-built CLI.

**What's needed**:

- Make CLI self-aware and portable
- Ensure `/system` and `/react` exist before eval runs
- Consider self-building CLI on first run

**Why**: Cleaner distribution model. Avoids environment conflicts.

**Files**: Multiple. Needs architectural planning.

**Reference**: [todo.md](todo.md)

---

### 8. Source Maps

**Why**: Better debugging experience when inspecting bundled code.

**Files**: [packager/bundler/esbuild.ts](packager/bundler/esbuild.ts)

---

### 9. Package Caching

**Why**: Skip bundling when inputs unchanged. Similar to #6 but for full packages.

**Files**: [packager/worker.ts](packager/worker.ts)

---

## Out of Scope

- **CLI self-bundling** — Chicken-egg problem. Keep as separate build step.
- **Error message polish** — Missing `ui.config.ts`, invalid config syntax, schema validation. Nice-to-have but not blocking.
- **Panda dual rebuild** — Expected behavior (two separate processes). Not a bug.

---

## Testing

Before marking items complete:

1. Run full test matrix: `cd packages/reference-test && pnpm run test:matrix`
2. Test watch mode with multiple file changes
3. Test one-shot build (`ref sync` without `--watch`)
4. Verify no memory leaks in long-running watch mode

---

## Progress Tracking

- [x] Extract `debounce` to lib/
- [x] Extract `toRelativeImport` to lib/path.ts
- [x] Extract `runCollectScript` to system/collectors/
- [x] Restructure packager (bundler/, package/, install/)
- [x] Implement debouncing in workers
- [ ] Graceful shutdown (#1)
- [ ] Temp file cleanup (#2)
- [ ] Public build-time API (#3)
- [ ] Config-aware install (#4)
- [ ] Skip config rebuild optimization (#5)
- [ ] Cache packager-ts (#6)
