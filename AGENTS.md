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
> **DO NOT start background `pnpm dev:lib` or `cosmos` processes.**
> The developer runs `pnpm dev:lib` locally in their terminal to monitor logs and avoid port collisions.
> If Cosmos on port 5000 is not reachable, politely ask the developer:
> *"Please run `pnpm dev:lib` in your terminal so I can inspect and interact with the Cosmos fixtures."*

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
  await frame.locator('...').click();
  await capture('clicked');
"

# 3. Or pass a custom script file:
pnpm capture <Component> [Fixture] -s path/to/script.mjs

# 4. Or snapshot resting state (auto-defaults to primary fixture if omitted):
pnpm capture <Component> [Fixture]

# 5. Or use the programmatic API from any node script:
# import { captureFixture } from './.agents/skills/tweak-component/scripts/capture.mjs'
```

In scripts, you receive: `{ page, frame, root, target, interactive, capture, pressTab, inspectStyles, wait }`.
- `capture(label, [locator])`: Captures outline-padded screenshot, syncs to Antigravity brain dir, and adds to markdown table.
- `pressTab([locator])`: Triggers native keyboard `:focus-visible` outline via temporary shim button.
- `inspectStyles([locatorOrSelector])`: Inspects computed border, outline, and box-model styles of target or selector.
- `frame.evaluate(fn, arg)`: Executes code inside the fixture iframe's window/document context directly.
- `--inspect-styles`: CLI flag that dumps a computed styles table across states or for target.

Captures are automatically saved to `.reference-ui/captures/` with outline-safe padding and synced to the Antigravity conversation brain directory so they render in chat. **Always embed the markdown table emitted by `pnpm capture` directly into your response**.

---

## 3. Targeted Verification Commands

Run only scoped package checks (avoid global root test commands):

```bash
# Typecheck library
pnpm --filter @reference-ui/lib run typecheck

# Unit tests (Vitest)
pnpm --filter @reference-ui/lib test

# Build library before browser tests (matrix/lib consumes dist/index.mjs bundle)
pnpm --filter @reference-ui/lib run build

# Browser E2E contracts (Playwright)
pnpm --dir matrix/lib exec playwright test tests/e2e/<component>.spec.ts
```

> [!NOTE]
> `matrix/lib` playwright tests consume `@reference-ui/lib` from `dist/index.mjs`.
> If you make changes in `packages/reference-lib/src/`, always run:
> `pnpm --filter @reference-ui/lib run build`
> before executing the Playwright tests so they test your latest source changes.
