---
name: tweak-component
description: Autonomous workflow for inspecting, tweaking, and verifying components in @reference-ui/lib against Cosmos fixtures, visual snapshots, and Vitest/Playwright test contracts.
---

# Component Tweaking & Manufacturing Skill (`tweak-component`)

Use this skill when tasked with fixing, implementing, or visually polishing any component in `@reference-ui/lib`.

---

## 1. Pre-flight Check: Cosmos Dev Server

> [!IMPORTANT]
> **NEVER start background `pnpm dev:lib` or `cosmos` commands.**
> The developer runs `pnpm dev:lib` locally in their own terminal to monitor logs and prevent port conflicts.

Before attempting visual fixture capture:
1. Verify if the Cosmos dev server is responding at `http://localhost:5000/`.
2. If it is **not running**, politely stop and ask the developer:
   *"Please run `pnpm dev:lib` in your terminal so I can inspect and interact with the Cosmos fixtures."*
3. Wait for the user to confirm it is up before running fixture captures.

---

## 2. The 5-Step Agentic Manufacturing Loop

### Step 1: Contract Ingestion
Read the component design specification and test contract before modifying code:
- Specification: `packages/reference-lib/src/components/<Component>/<Component>.md`
- Test Contract: `packages/reference-lib/src/components/<Component>/TESTS.md`
- Roadmap / Gaps: `packages/reference-lib/src/components/<Component>/NEXT.md` (if present)

### Step 2: Visual & Behavioral Baseline Capture
Run the capture script to take a snapshot of the current state:
```bash
node .agents/skills/tweak-component/scripts/capture.mjs <ComponentName> <FixtureName> /Users/ryn/.gemini/antigravity/brain/<conversation-id>/before_<name>.png
```
Use `view_file` to visually examine the generated screenshot and identify:
- Visual defects, misalignment, or nested borders (e.g. double bezel).
- State discrepancies between input text and display text.

### Step 3: Implement & Tweak Component Code
Apply modifications under `packages/reference-lib/src/components/<Component>/`:
- Adhere strictly to the **7 Architectural Laws** in `packages/reference-lib/AGENTS.md`.
- No polymorphic `as` props; respect fixed host elements (`ReferencePartProps<Tag>`).
- Respect the **Part-Resolution Law** for prop merging and ref composition.
- Isolate state in internal Zustand stores or headless hooks without public Context providers.
- Maintain APG combobox/dialog accessibility contracts.

### Step 4: Verification Suite
Execute targeted checks locally (never run global `pnpm test` wrappers):
```bash
# 1. Typecheck
pnpm --filter @reference-ui/lib run typecheck

# 2. Pure Model Unit Tests (Vitest)
cd matrix/lib && pnpm exec vitest run tests/unit/<component>.test.ts

# 3. Browser E2E Tests (Playwright)
cd matrix/lib && pnpm exec playwright test tests/e2e/<component>.spec.ts
```

### Step 5: Visual Re-inspection & Sign-off
1. Capture an updated screenshot:
   ```bash
   node .agents/skills/tweak-component/scripts/capture.mjs <ComponentName> <FixtureName> /Users/ryn/.gemini/antigravity/brain/<conversation-id>/after_<name>.png
   ```
2. View the new image with `view_file` to confirm visual defects are resolved.
3. Update `packages/reference-lib/src/components/<Component>/TESTS.md` by marking verified items as `- [x] <PREFIX>-...`.
4. Report back to the user with a concise summary and side-by-side before/after screenshots.
