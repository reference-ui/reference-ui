# CLI Pre-Test Analysis

Analysis of potential failure points in the `ref` CLI and current test coverage. Goal: minimal testing that catches real issues, not exhaustive unit testing.

---

## CLI Pipeline Overview

```
ref sync [--watch]
    ↓
1. Load config (ui.config.ts)
2. Init event bus + logging
3. [Optional] Watch mode init
4. Virtual: Copy user files
5. System: Compile Panda config
6. Packager: Bundle @reference-ui/react
7. Packager-TS: Emit .d.ts files
```

---

## Potential Failure Points vs Current Coverage

### 🟢 Well Covered

| Failure Point                 | Test Coverage         | Notes                                            |
| ----------------------------- | --------------------- | ------------------------------------------------ |
| **Output artifacts missing**  | `core-system.spec.ts` | Checks `styles.css` exists after sync            |
| **Styles not applied**        | `tokens.spec.ts`      | Verifies computed styles match config tokens     |
| **Watch mode not rebuilding** | `sync-watch.spec.ts`  | Edits file, waits for color change (30s timeout) |
| **Token values incorrect**    | `tokens.spec.ts`      | Hex → RGB comparison with config                 |
| **Config tokens not synced**  | `tokens.spec.ts`      | Custom colors from `ui.config.ts` appear in DOM  |

### 🟡 Partially Covered / Implicit

| Failure Point                        | Current Coverage          | Gap                                                      |
| ------------------------------------ | ------------------------- | -------------------------------------------------------- |
| **CLI not executable**               | `prepare.ts` runs it      | Not explicitly tested; if build broken, prepare fails    |
| **Process doesn't exit (non-watch)** | Implicit                  | Tests would hang if sync never exits                     |
| **Packager produces invalid JS**     | Implicit (app imports it) | If bundled code broke, app mount would fail              |
| **Type definitions missing**         | None                      | `.d.ts` files not checked (currently unused in test app) |
| **Multiple React versions**          | Matrix tests              | react17/18/19 sandboxes exist, coverage TBD              |

### 🔴 Not Covered

| Failure Point                      | Risk Level | Rationale for Skipping / Addressing                             |
| ---------------------------------- | ---------- | --------------------------------------------------------------- |
| **Config file not found**          | Medium     | CLI would throw; real-world users hit this. **Consider adding** |
| **Config syntax error**            | Medium     | CLI would throw; common user error. **Consider adding**         |
| **Invalid token schema**           | Low        | TypeScript catches most; runtime edge cases rare                |
| **System worker crash**            | Low        | Would fail sync; hard to reproduce without mocking              |
| **Packager worker crash**          | Low        | Would fail sync; thread-pool errors logged but not tested       |
| **Watch mode doesn't stop**        | Low        | Manual QA; hard to automate meaningfully                        |
| **Port conflict (watch + vite)**   | Low        | Matrix uses distinct ports; tested implicitly                   |
| **Event bus deadlock**             | Very Low   | Internal plumbing; no known repro cases                         |
| **Incomplete file copy (virtual)** | Very Low   | OS-level failure; not worth testing                             |
| **Logging fails**                  | Very Low   | Doesn't affect correctness                                      |

---

## Missing High-Value Test Cases

### 1. Config Errors (User-Facing)

**Scenario:** User provides invalid `ui.config.ts`

```typescript
// Missing file
// Syntax error
// Invalid token value (e.g., color: 123)
```

**Why test:** Common user mistake, should fail gracefully with clear error.

**Current state:** Not tested. CLI likely throws but message quality unknown.

**Action:** Add test for missing/invalid config. Check that:

- CLI exits with non-zero code
- Error message mentions config file
- No orphaned processes

---

### 2. CLI Exit Codes

**Scenario:** `ref sync` should exit 0 on success, non-zero on failure

**Current state:** Not explicitly checked (tests pass = implicit success)

**Action:** Low priority. Tests already fail if sync fails; exit code is implicitly tested.

---

### 3. Incremental Builds (Idempotent)

**Scenario:** Running `ref sync` twice with no changes should be fast + produce same output

**Current state:** Not tested, but `prepare.ts` has incremental logic (`.prep-state.json`)

**Action:** Low priority for now. Not a failure mode, performance concern only.

---

### 4. Concurrent Watch Mode

**Scenario:** Two `ref sync --watch` processes in same directory

**Current state:** Not tested

**Action:** Skip. Edge case, users shouldn't do this.

---

### 5. Type Definitions Exist

**Scenario:** `.d.ts` files generated after sync

**Current state:** Not tested

**Action:** Add simple check if `.d.ts` will be consumed in real apps. For now, styles are the critical output.

---

## Test Gaps We Can Live With

- **Worker thread crashes:** Hard to test without mocking; CLI logs errors, tests would fail anyway
- **File system permissions:** OS-level, not our domain
- **Network failures:** No network calls in CLI
- **Memory leaks in watch mode:** Requires long-running manual QA
- **Panda CSS internals:** We test output, not Panda's correctness
- **Thread pool edge cases:** Internal implementation detail

---

## Future Polish (Not Required for CLI Upgrade)

### Config Error Handling

Add when doing final polish:

```typescript
test('ref sync fails gracefully with missing config', async () => {
  // Create sandbox without ui.config.ts
  // Run ref sync
  // Expect non-zero exit
  // Expect error message contains "ui.config"
})
```

**Why:** User-facing quality, but can assume clean config during CLI development.

### Type Definitions Check

Add if `.d.ts` files become critical:

```typescript
test('ref sync generates .d.ts files', () => {
  const dtsPath = join(sandboxDir, 'node_modules/@reference-ui/react/index.d.ts')
  expect(existsSync(dtsPath)).toBe(true)
})
```

### Watch Mode Stability

Test that watch mode doesn't crash after 10+ file changes. Manual QA for now.

---

## Coverage Assessment

### Current State

✅ **Core happy path**: Sync runs, styles render, tokens work  
✅ **Watch mode basics**: Detects changes, rebuilds  
✅ **Multi-environment**: React 17/18/19 matrix (structure exists)  
❌ **Error paths**: Config errors, CLI failures  
❌ **Edge cases**: Concurrent sync, type definitions

### Overall Grade: **A-** (for CLI upgrade purposes)

**Strong:** Output correctness, runtime behavior, watch mode  
**Future polish:** Error handling, failure modes, type definitions

**Verdict:** Current tests cover the critical path comprehensively. **Sufficient to proceed with CLI upgrade.** Assume clean config; error handling can be added as final polish later.

---

## CLI Upgrade Checklist

Core requirements (assume clean config):

- [ ] All existing tests still pass (no regressions)
- [ ] `ref sync` exits cleanly on success
- [ ] Watch mode still picks up file changes (see `sync-watch.spec.ts`)
- [ ] Output artifacts match expected paths
- [ ] No orphaned processes after sync (non-watch)
- [ ] CLI is executable (`chmod +x`, shebang present)

Final polish (later):

- [ ] Missing `ui.config.ts` produces clear error
- [ ] Error messages are actionable (file paths, suggestions)
- [ ] Type definitions present and correct

---

## Philosophy

> "Test the contract, not the implementation."

We care that:

- Tokens in `ui.config.ts` → CSS in browser
- Watch mode rebuilds on change
- Errors are clear when things go wrong

We **don't** care about:

- Internal worker thread behavior
- Event bus message order
- Panda CSS compilation details
- Logging format

Keep tests minimal, focused on user-facing behavior. If the CLI changes architecture (e.g., removes workers, switches bundlers), **tests should not break** as long as output is correct.

---

## Next Steps for CLI Upgrade

1. Run existing test suite to establish baseline
2. Upgrade/finalize CLI implementation
3. Re-run full test matrix (all tests should pass)
4. Document any new CLI flags/options in this file
5. _(Later)_ Add error handling tests as final polish

**Current coverage is sufficient to proceed with confidence.**
