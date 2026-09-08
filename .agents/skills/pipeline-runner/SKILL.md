---
name: pipeline-runner
description: Miniature agent CLI and unthrottled test runner for Reference UI. Breaks out of macOS / Antigravity IDE background QoS clamping (PRI 31 -> PRI 46), unthrottles CPU & disk I/O, streams clean logs, and provides targeted matrix testing and 4-phase component verification.
---

# Agent Pipeline & Test Runner (`pipeline-runner`)

Use this skill when executing matrix tests, running full component verification suites, checking environment health, or jailbreaking out of Antigravity IDE subshell resource throttling.

---

## 1. Why This Exists: The Subshell QoS Clamp

Processes spawned by Antigravity IDE on macOS inherit Darwin's background Utility QoS tier (`PRI 31`, flags `4004`). In this tier:
- Darwin limits thread scheduling across Performance cores (P-cores).
- Disk and socket I/O are throttled (`IOPOL_THROTTLE`), severely slowing down Dagger engine RPCs and Docker container operations (`buildctl dial-stdio`).
- TTY progress spinners (`ora` / `\r`) buffer and appear frozen in agent logs.

The `pipeline-runner` CLI automatically jailbreaks every command using Darwin's `taskpolicy -a -d default -t 0 -l 0`, elevating priority to **`PRI 46`** (User Interactive Application tier), unthrottling I/O, and cleaning carriage-return output streams.

---

## 2. CLI Usage Reference (`pnpm agent`)

The runner is mapped to `pnpm agent` in the workspace root.

```bash
# 1. Inspect environment health, priority, and daemon status:
pnpm agent status

# 2. Run targeted matrix tests (unthrottled wrapper around pipeline test):
pnpm agent test --packages=@matrix/lib
pnpm agent test matrix --packages=@matrix/tokens
pnpm agent test:matrix  # Full matrix run across all variants (--full)
pnpm agent matrix --packages=@matrix/primitives

# Canonical root shortcut for full matrix:
pnpm pipeline:test:matrix

# 3. Fast 4-Phase Component Verification:
# (Runs typecheck -> vitest -> build -> targeted Playwright E2E spec in one command)
pnpm agent verify Toast
pnpm agent verify Combobox

# 4. Direct pipeline pass-through:
pnpm agent pipeline test --packages=@matrix/tokens
pnpm agent clean
pnpm agent setup --packages=@matrix/distro --sync
```

### Programmatic API

You can also import the runner programmatically from any Node script:

```javascript
import { runMatrix, runPipeline, runCommand } from './.agents/skills/pipeline-runner/scripts/run.mjs'

// Run matrix tests with options:
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
