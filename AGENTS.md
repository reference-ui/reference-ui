# Reference UI Agent Guidelines

Repository-wide conventions, dev server policies, and visual verification instructions for all AI agents.

---

## 0. Component Polishing & Tweaking Contract (`tweak-component`)

Whenever a user prompt asks to fix, polish, style, improve, or adjust how any component in `@reference-ui/lib` feels or looks:
- **Immediately activate the `tweak-component` skill** (`.agents/skills/tweak-component/SKILL.md`).
- **Do NOT pause for speculative planning mode artifacts** (`implementation_plan.md`). Jump straight into the 5-step loop:
  1. **Contract Ingestion**: Read `<Component>.md` and `TESTS.md`.
  2. **Baseline Capture**: Run `pnpm capture <Component>` and embed the screenshot directly in chat.
  3. **Implement & Tweak**: Apply changes in `packages/reference-lib/src/components/<Component>/`.
  4. **Verification**: Run targeted `typecheck`, `vitest`, `build`, and Playwright E2E checks.
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

## 3. Targeted Verification Commands & Agent Runner (`pnpm agent`)

> [!TIP]
> **macOS QoS Jailbreak & Fast Runner**:
> Antigravity IDE subshells inherit Darwin background QoS (`PRI 31`).
> Use the built-in miniature agent CLI (`pnpm agent`) to run commands at full interactive performance (`PRI 46`), unthrottled I/O, and with non-TTY progress unbuffering.

```bash
# 0. Check runner & daemon status:
pnpm agent status

# 1. Full 4-Phase Component Verification in One Shot (RECOMMENDED for components):
# (Runs typecheck -> vitest -> build -> targeted matrix Playwright spec with cached deps)
pnpm agent verify <ComponentName>
# e.g.: pnpm agent verify Toast

# 2. Scoped Individual Checks:
# Typecheck library
pnpm --filter @reference-ui/lib run typecheck

# Unit tests (Vitest)
pnpm --filter @reference-ui/lib test

# Build library before browser tests (matrix/lib consumes dist/index.mjs bundle)
pnpm --filter @reference-ui/lib run build

# 3. Matrix Testing (Unthrottled Dagger Runner):
pnpm agent test --packages=@matrix/<package>
# or canonical fallback:
pnpm pipeline test --packages=@matrix/<package>
```

> [!IMPORTANT]
> **Matrix Testing Policy**:
> ALWAYS use `pnpm agent test --packages=@matrix/<package>` (or `pnpm pipeline test --packages=@matrix/<package>`) to test matrix packages.
> Do NOT execute raw `playwright test` directly inside matrix packages. The pipeline CLI is the canonical, hermetic testing system that manages dependencies, environments, and runners correctly.

> [!NOTE]
> **Terminal Bridge Mode (Optional)**:
> If you have an external terminal open, run `pnpm agent daemon`. The agent will automatically route heavy test runs through your native terminal session over a local socket (`/tmp/reference-ui-agent.sock`). If the daemon is inactive, `pnpm agent` executes directly with `taskpolicy -a` QoS elevation.

