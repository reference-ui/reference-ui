# Reference UI Agent Guidelines

Repository-wide conventions, dev server policies, and visual verification instructions for all AI agents.

---

## Skills vs `test-core`

`tweak-component` and `test-component` are **skills** (component workflows for `@reference-ui/lib`).

**`test-core` is not a skill.** It is the pipeline runner (`pnpm agent`) for `packages/reference-core` and the matrix. Docs live at `.agents/skills/test-core/SKILL.md` so agents can find the CLI — treat it as infrastructure, not a manufacturing loop.

| You changed | Use |
| --- | --- |
| `@reference-ui/lib` look/feel | `tweak-component` skill |
| `@reference-ui/lib` component logic / CT / snapshots | `test-component` skill (`pnpm agentct`) |
| `packages/reference-core`, `matrix/*`, pipeline, bundler/runtime contracts | **test-core** (`pnpm agent`) |

If a lib-component task also modified `packages/reference-core`, finish `test-component` for the component, then **switch to test-core** for core/matrix proof. `pnpm agentct` does not cover core.

---

## 0. Component Polishing & Tweaking Contract (`tweak-component`)

Whenever a user prompt asks to fix, polish, style, improve, or adjust how any component in `@reference-ui/lib` feels or looks:
- **Immediately activate the `tweak-component` skill** (`.agents/skills/tweak-component/SKILL.md`).
- **Do NOT pause for speculative planning mode artifacts** (`implementation_plan.md`). Jump straight into the 5-step loop:
  1. **Contract Ingestion**: Read `<Component>.md` and `SPEC.md` (driver). `TESTS.md` is the case catalog when SPEC points at it.
  2. **Baseline Capture**: Run `pnpm capture <Component>` and embed the screenshot directly in chat.
  3. **Implement & Tweak**: Apply changes in `packages/reference-lib/src/components/<Component>/`.
  4. **Verification**: Follow the `test-component` skill (`pnpm agentct`). If `packages/reference-core` was also modified, switch to **test-core** (`pnpm agent`) — that is the pipeline runner, not a skill.
  5. **Multi-State Visual Re-inspection**: Run `pnpm capture <Component> --states` and embed the markdown table into chat.

---

## 1. Dev Server & Local Environment Policy

> [!IMPORTANT]
> **DO NOT start background `pnpm dev:lib` processes.**
> The developer runs `pnpm dev:lib` locally in their terminal to monitor logs and avoid port collisions.
> If the Book dev server on port 5000 is not reachable, politely ask the developer:
> *"Please run `pnpm dev:lib` in your terminal so I can inspect and interact with the Book stories."*

---

## 2. Visual Fixture Inspection & Screenshots

> [!CAUTION]
> **NEVER execute ad-hoc Playwright scripts or one-liners** such as:
> `node -e "const { chromium } = require('playwright'); ..."`
> `playwright` is NOT a root dependency; doing this causes `Cannot find module 'playwright'` errors and wastes tokens.

### The Canonical Capture Command
Use the built-in capture tool from the workspace root to script and snapshot any component scenario:

```bash
# 1. Discover all components or fixtures:
pnpm capture --list
pnpm capture <Component> --list

# 2. Script any custom interactions and states directly (RECOMMENDED):
pnpm capture <Component> [Fixture] -e "
  await capture('resting');
  await canvas.locator('...').click();
  await capture('clicked');
"

# 3. Or pass a custom script file:
pnpm capture <Component> [Fixture] -s path/to/script.mjs

# 4. Or snapshot resting state (auto-defaults to primary fixture if omitted):
pnpm capture <Component> [Fixture]

# 5. Or use the programmatic API from any node script:
# import { captureFixture } from './.agents/skills/tweak-component/scripts/capture.mjs'
```

In scripts, you receive: `{ page, canvas, root, target, interactive, capture, pressTab, inspectStyles, wait, frame }`.
- `canvas`: `[data-book-canvas]` story host locator in the single Book document.
- `root`: Alias of `canvas` (story root).
- `frame`: Deprecated compat alias for `page` / `canvas` in single-document Book.
- `capture(label, [locator])`: Captures outline-padded screenshot, syncs to Antigravity brain dir, and adds to markdown table.
- `pressTab([locator])`: Triggers native keyboard `:focus-visible` outline via temporary shim button.
- `inspectStyles([locatorOrSelector])`: Inspects computed border, outline, and box-model styles of target or selector.
- `--inspect-styles`: CLI flag that dumps a computed styles table across states or for target.

Captures are automatically saved to `.reference-ui/captures/` with outline-safe padding and synced to the Antigravity conversation brain directory so they render in chat. **Always embed the markdown table emitted by `pnpm capture` directly into your response**.

---

## 3. Core / Matrix Verification (`test-core`, `pnpm agent`)

`test-core` is the pipeline runner, **not a skill**. Follow `.agents/skills/test-core/SKILL.md` whenever you change `packages/reference-core` or need hermetic matrix proof. Do not use `test-component` / `pnpm agentct` for core.

> [!TIP]
> **macOS QoS Jailbreak & Fast Runner**:
> Antigravity IDE subshells inherit Darwin background QoS (`PRI 31`).
> Use the `test-core` CLI (`pnpm agent`) to run commands at full interactive performance (`PRI 46`), unthrottled I/O, and with non-TTY progress unbuffering.

```bash
# 0. Check runner & daemon status:
pnpm agent status

# 1. Fast Native Iteration (Recommended during component tweaking & spec tests):
# (Runs unthrottled PRI 46 natively, with port 4173 cleanup, queue locks, and exit pass signals)
pnpm agent playwright overlays -g "OV-OUT"
pnpm agent playwright overlays -g "OV-LAYER"
pnpm agent playwright lib tests/e2e/toast.spec.ts
pnpm agent pw -g "OV-OUT"              # Auto-infers matrix/overlays

# Native Vitest (unit tests):
pnpm agent vitest lib -t "Dialog"
pnpm agent vitest core                 # packages/reference-core
pnpm agent vt packages/reference-lib/src/components/Dialog/__tests__/Dialog.test.tsx

# 2. Full 4-Phase Component Verification in One Shot (Final check before completion):
# (Runs typecheck -> vitest -> build -> targeted matrix Playwright spec with cached deps)
pnpm agent verify <ComponentName>
# e.g.: pnpm agent verify Toast

# 3. Hermetic Matrix Verification (Unthrottled Dagger Runner across bundlers & React runtimes):
pnpm agent test --packages=@matrix/<package>
# or canonical fallback:
pnpm pipeline test --packages=@matrix/<package>
```

> [!IMPORTANT]
> **Testing Policy (`test-core`)**:
> - **Never execute raw Playwright or Vitest commands directly in subshells** (e.g. `pnpm --dir matrix/... exec playwright test`). Raw subshell commands run under clamped Darwin QoS (`PRI 31`), orphan Vite processes on port 4173, and lack clean exit pass signaling on SIGINT.
> - **Always use `pnpm agent playwright` / `pnpm agent vitest`** for fast native iteration.
> - **Use `pnpm agent test --packages=@matrix/<package>`** when you need full, hermetic multi-runtime/bundler matrix validation in Dagger containers.
> - After a `packages/reference-core` change, this section is the proof path — not `pnpm agentct`.

> [!NOTE]
> **Terminal Bridge Mode (Optional)**:
> If you have an external terminal open, run `pnpm agent daemon`. The agent will automatically route heavy test runs through your native terminal session over a local socket (`/tmp/reference-ui-agent.sock`). If the daemon is inactive, `pnpm agent` executes directly with `taskpolicy -a` QoS elevation.

