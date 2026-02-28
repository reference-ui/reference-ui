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

