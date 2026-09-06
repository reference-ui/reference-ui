---
name: tweak-component
description: Autonomous workflow for inspecting, tweaking, and verifying components in @reference-ui/lib against Cosmos fixtures, returning visual screenshots, and passing Vitest/Playwright test contracts.
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

### Step 2: Baseline Capture & Immediate Visual Sharing
Establish the visual baseline and **share it with the developer immediately in chat**:
```bash
pnpm capture <ComponentName> [FixtureName] --states
```
- Or with explicit output dir: `pnpm capture <ComponentName> [FixtureName] --states --out-dir <artifacts-dir>`
- The script automatically outputs unclipped resting, hover, focus (pointer click), tab (keyboard focus-visible outline), and popup screenshots along with a ready-to-paste markdown table.
- To discover available fixtures: `pnpm capture <ComponentName> --list`
- If fixture name is omitted, it auto-selects the primary fixture.
- **MANDATORY**: Embed the captured baseline screenshots directly into your chat response (`![Caption](/absolute/path.png)`). Never proceed without letting the user see what the baseline looks like.
- Inspect the images with `view_file` to identify visual bugs, misalignment, nested borders, or clipped triggers.

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
pnpm --filter @reference-ui/lib test

# 3. Browser E2E Tests (Playwright)
pnpm --dir matrix/lib exec playwright test tests/e2e/<component>.spec.ts
```

### Step 5: Visual Re-inspection & Mandatory Visual Feedback
After passing tests, verify the visual result and **always return screenshots in chat**:
1. Run the multi-state capture script:
   ```bash
   pnpm capture <ComponentName> [FixtureName] --states
   ```
2. Visually inspect the generated files with `view_file`.
3. **MANDATORY USER VISUAL FEEDBACK**:
   - Always paste the markdown snippet printed by `capture.mjs` directly into your user-facing chat response.
   - Present a side-by-side or multi-state comparison table (e.g. `Resting | Hover | Focus (Click) | Tab (Keyboard) | Open`).
   - The user must never have to ask to see screenshots; they should be returned automatically with every verification.
4. Update `packages/reference-lib/src/components/<Component>/TESTS.md` by marking verified items as `- [x] <PREFIX>-...`.
5. Update `walkthrough.md` with the embedded images and geometric breakdown.

---

## 3. Capture Tool Reference (`pnpm capture`)

Syntax:
```bash
pnpm capture <Component> [Fixture] [options]
```

Options:
- `--states`: Captures `Resting` (mouse at 0,0), `Hover` (trigger hovered), `Focus` (pointer clicked), `Tab` (keyboard `:focus-visible` with outline), and `Open` (if trigger opens a dialog/listbox/menu).
- `--list`: List all available fixture exports for the component.
- `--target <css>`: Specific element to snapshot inside the fixture iframe (auto-defaults to `[data-reference-field]`, then fixture root, then `#root`).
- `--hover <css>`: Manually hover a specific element.
- `--click <css>`: Manually click a specific element.
- `--focus`: Focus the primary interactive element.
- `--tab`: Tab into the primary interactive element (`:focus-visible`).
- `--pad <px>`: Padding around the bounding box to preserve focus rings, shadows, and outlines (default `20`).
- `--out-dir <dir>`: Directory where screenshots will be stored (default: `.reference-ui/captures/`).
- `--viewport <WxH>`: Custom viewport dimensions (default `1000x700`).
- `--wait <ms>`: Delay for Cosmos postMessage handshake (default `2200`).

Output:
- Saves unclipped, focus-ring-safe images of component + popovers to workspace directory.
- Emits markdown snippets and tables ready to paste directly into chat messages and `walkthrough.md`.
