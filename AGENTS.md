# Reference UI Agent Guidelines

Repository-wide conventions, dev server policies, and visual verification instructions for all AI agents.

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
Use the built-in capture tool from the workspace root:

```bash
# 1. Capture resting, hover, focus (click), keyboard tab (:focus-visible), and open states:
pnpm capture <Component> [Fixture] --states

# 2. List available fixtures for a component:
pnpm capture <Component> --list

# 3. Capture single state (auto-defaults to the primary fixture if omitted):
pnpm capture <Component> [Fixture]
```

Examples:
- `pnpm capture Field Default --states`
- `pnpm capture Slider NativeParity --states`
- `pnpm capture Combobox Searchable --states`
- `pnpm capture Button --list`

Captures are automatically saved to `.reference-ui/captures/` with outline-safe padding. When verifying visual changes, **always embed the markdown table emitted by `pnpm capture` directly into your response**.

---

## 3. Targeted Verification Commands

Run only scoped package checks (avoid global root test commands):

```bash
# Typecheck library
pnpm --filter @reference-ui/lib run typecheck

# Unit tests (Vitest)
pnpm --filter @reference-ui/lib test

# Browser E2E contracts (Playwright)
pnpm --dir matrix/lib exec playwright test tests/e2e/<component>.spec.ts
```
