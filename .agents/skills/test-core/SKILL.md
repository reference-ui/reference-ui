---
name: test-core
description: Core and matrix verification runner for Reference UI (the pipeline runner — not a component skill). Activate when modifying packages/reference-core, matrix packages, pipeline, Vite/Webpack plugins, sync, packager, or hermetic React/bundler contracts. CLI is `pnpm agent`. Do not use test-component for core changes.
---

# Core / Matrix Test Runner (`test-core`)

**This is not a skill.** `tweak-component` and `test-component` are component workflows for `@reference-ui/lib`. `test-core` is the pipeline runner: the CLI (`pnpm agent`) and the verification layer for `packages/reference-core` and the matrix.

The docs live under `.agents/skills/test-core` only so agents can find the runner. Treat it as infrastructure, not a manufacturing loop.

Use `test-core` when you changed any of:

- `packages/reference-core` (CLI, sync, Vite/Webpack plugins, packager, types, Book discovery, Playwright host, React runtime aliases, virtual FS, MCP, …)
- `matrix/*` packages
- pipeline / Dagger / hermetic React + bundler contracts

Do **not** use `pnpm ct` / `test-component` for that work. That skill only covers colocated unit + Playwright CT for `@reference-ui/lib` components.

---

## 1. Why the CLI exists: the subshell QoS clamp

Processes spawned by Antigravity IDE on macOS inherit Darwin's background Utility QoS tier (`PRI 31`, flags `4004`). In this tier:
- Darwin limits thread scheduling across Performance cores (P-cores).
- Disk and socket I/O are throttled (`IOPOL_THROTTLE`), severely slowing down Dagger engine RPCs and Docker container operations (`buildctl dial-stdio`).
- TTY progress spinners (`ora` / `\r`) buffer and appear frozen in agent logs.

The `test-core` CLI (`pnpm agent`) jailbreaks every command using Darwin's `taskpolicy -a -d default -t 0 -l 0`, elevating priority to **`PRI 46`** (User Interactive Application tier), unthrottling I/O, and cleaning carriage-return output streams.

---

## 2. CLI Usage Reference (`pnpm agent`)

The runner is mapped to `pnpm agent` in the workspace root (with shortcuts `pnpm agent:pw` and `pnpm agent:vitest`).

```bash
# 1. Inspect environment health, priority, and daemon status:
pnpm agent status

# 2. Fast Native Playwright Iteration (Unthrottled PRI 46, Port Cleanup, Pass Signals):
# (Bypasses container overhead; runs natively on host hardware with clean signal handling)
pnpm agent playwright overlays -g "OV-OUT"
pnpm agent playwright overlays -g "OV-LAYER"
pnpm agent playwright lib tests/e2e/toast.spec.ts
pnpm agent pw -g "OV-OUT"              # Auto-infers matrix/overlays from test prefix
pnpm agent pw --workers 4              # Harness multi-core hardware

# 3. Fast Native Vitest (Unit Tests):
pnpm agent vitest lib -t "Dialog"
pnpm agent vitest core                 # packages/reference-core
pnpm agent vitest -t "Overlay"
pnpm agent vt packages/reference-lib/src/components/Dialog/__tests__/Dialog.test.tsx

# 4. Fast 4-Phase Component Verification (lib, after core is already green):
# (Runs typecheck -> vitest -> build -> targeted Playwright E2E spec in one command)
pnpm agent verify Toast
pnpm agent verify Combobox

# 5. Full Hermetic Matrix Tests (Dagger containers across React versions & bundlers):
# This is the default proof after a reference-core change.
pnpm agent test --packages=@matrix/lib
pnpm agent test matrix --packages=@matrix/tokens
pnpm agent test:matrix  # Full matrix run across all variants (--full)
pnpm agent matrix --packages=@matrix/primitives

# Canonical root shortcut for full matrix:
pnpm pipeline:test:matrix

# 6. Direct pipeline pass-through:
pnpm agent pipeline test --packages=@matrix/tokens
pnpm agent clean
pnpm agent setup --packages=@matrix/distro --sync
```

### After a `reference-core` change

1. Unit/typecheck in core: `pnpm agent vitest core` (and `pnpm agent run pnpm --filter @reference-ui/core typecheck` if needed).
2. Rebuild what the matrix consumes (`pnpm agent` auto-builds `@reference-ui/lib` dist when Playwright needs it; pass `--build` to force).
3. Run the matrix package(s) that cover the surface you touched, e.g. `@matrix/virtual`, `@matrix/session`, `@matrix/mcp`, `@matrix/typescript`, `@matrix/distro`, `@matrix/system`, `@matrix/playwright`.
4. Do not stop at `pnpm ct`. Component CT does not exercise core.

### Process Lifecycle, Signal Control & Pass Signaling

Native Playwright and Vitest commands solve several persistent agent challenges:
1. **Automatic Port 4173 Management**: Because `playwright.config.ts` sets `reuseExistingServer: true`, running raw Playwright directly leaves Vite running as an orphaned daemon (PPID 1). `pnpm agent playwright` automatically clears stale servers before execution and cleans up any test servers on teardown (unless `--keep-server` is passed).
2. **Deterministic Exit Pass Signals**: If all tests in the requested suite PASS (`N passed, 0 failed`), the runner explicitly guarantees an exit code of `0` and emits an unambiguous pass banner (`✔ [agent] Playwright suite PASSED`), even if SIGINT occurs during worker shutdown or server teardown.
3. **Clean Process Group Termination**: Intercepts `SIGINT` and `SIGTERM` and ensures child processes and background web servers are terminated cleanly without leaving orphaned zombies.
4. **Auto-Build Protection**: Automatically checks if `@reference-ui/lib` (`dist/index.mjs`) is built and runs a fast build if missing, preventing stale bundle errors when testing matrix packages. Pass `--build` to force a rebuild or `--no-build` to skip.

### Programmatic API

You can also import the runner programmatically from any Node script:

```javascript
import { runPlaywright, runVitest, runMatrix, runPipeline, runCommand } from './.agents/skills/test-core/scripts/run.mjs'

// Run native Playwright tests:
await runPlaywright(['overlays', '-g', 'OV-OUT'])

// Run native Vitest unit tests:
await runVitest(['lib', '-t', 'Dialog'])
await runVitest(['core'])

// Run matrix tests in Dagger:
await runMatrix({
  packages: '@matrix/tokens',
  react: 'react19',
  full: false,
  trace: false,
})

// Run arbitrary pipeline commands:
await runPipeline('clean')
```

---

## 3. Optional Terminal Bridge Daemon Mode

If you prefer to run heavy test workloads 100% inside your external terminal window (similar to running `pnpm dev:lib` in terminal):

1. In your external terminal, run:
   ```bash
   pnpm agent daemon
   ```
2. The daemon listens on a local Unix domain socket (`/tmp/reference-ui-agent.sock`).
3. Whenever an agent or subshell runs `pnpm agent test` or `pnpm agent verify`, it automatically detects the running daemon and delegates execution straight to your external terminal session, streaming stdout/stderr back into the agent!
4. If the daemon is not running, it automatically and transparently falls back to direct unthrottled execution with `taskpolicy -a`.

---

## 4. Multi-Agent Cross-Process Queue

When multiple agents or processes request matrix tests or component verifications simultaneously, `test-core` serializes all executions through a strict **First-In, First-Out** queue:
- **Zero Parallel Crashes**: Prevents concurrent Docker / Dagger engine or port collisions by running test suites in series.
- **Cross-Process File Lock**: Uses an atomic file-based ticket lock in `/tmp/reference-ui-agent-queue` across all OS subshells and agent sessions.
- **Daemon Queue Support**: The Terminal Bridge daemon also maintains an in-memory queue with socket disconnect detection and cancellation cleanup.
- **Automatic Stale Lock Recovery**: If a running or waiting process is killed (`kill -9`, cancel), subsequent processes automatically prune the stale lock and proceed without freezing.
- **Live Status Reporting**: Waiting agents and developers receive regular updates (`[agent-queue] Another test is currently running (PID ...). Waiting in queue (position 1)...`).
