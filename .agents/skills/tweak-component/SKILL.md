---
name: tweak-component
description: Autonomous workflow for inspecting, tweaking, styling, and visually verifying components in @reference-ui/lib against Book stories (*.book.ts / *.book.tsx), returning visual screenshots, and passing Vitest/Playwright test contracts. Activate whenever the user asks to polish, style, fix, or improve how a component feels or looks.
---

# Component Tweaking & Manufacturing Skill (`tweak-component`)

Use this skill when tasked with fixing, implementing, or visually polishing any component in `@reference-ui/lib`.

---

## 1. Pre-flight Check: Book Dev Server

> [!IMPORTANT]
> **NEVER start background `pnpm dev:lib` processes.**
> The developer runs `pnpm dev:lib` locally in their own terminal to monitor logs and prevent port conflicts.

Before attempting visual capture:
1. Verify if the Book dev server is responding at `http://localhost:5000/`.
2. If it is **not running**, politely stop and ask the developer:
   *"Please run `pnpm dev:lib` in your terminal so I can inspect and interact with the Book stories."*
3. Wait for the user to confirm it is up before running captures.

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
# Snapshot resting state:
pnpm capture <ComponentName> [FixtureName]

# Or script custom interactions directly:
pnpm capture <ComponentName> [FixtureName] -e "
  await capture('resting');
  await canvas.locator('...').click();
  await capture('clicked');
"
```
- To discover all available components and fixtures: `pnpm capture --list` or `pnpm capture <ComponentName> --list`
- If fixture name is omitted, it auto-selects the primary fixture.
- The script automatically outputs unclipped screenshots, syncs to the Antigravity brain directory, and prints a ready-to-paste markdown table.
- **MANDATORY**: Embed the captured screenshots directly into your chat response (`![Caption](/absolute/path.png)`).
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
# Recommended: Run all 4 phases in one shot with automatic QoS jailbreak and dependency caching:
pnpm agent verify <ComponentName>
# e.g.: pnpm agent verify Toast

# Or run individual phases manually:
# 1. Typecheck
pnpm --filter @reference-ui/lib run typecheck

# 2. Pure Model Unit Tests (Vitest)
pnpm --filter @reference-ui/lib test

# 3. Build library before browser tests (matrix/lib consumes dist/index.mjs bundle)
pnpm --filter @reference-ui/lib run build

# 4. Browser E2E Tests (Playwright)
pnpm --dir matrix/lib exec playwright test tests/e2e/<component>.spec.ts
```

> [!NOTE]
> `matrix/lib` playwright tests consume `@reference-ui/lib` from `dist/index.mjs`.
> If you make changes in `packages/reference-lib/src/`, always run `pnpm --filter @reference-ui/lib run build` before running Playwright tests.

### Step 5: Visual Re-inspection & Mandatory Visual Feedback
After passing tests, verify the visual result and **always return screenshots in chat**:
1. Run the multi-state capture script (optionally with `--inspect-styles` to verify outline/border tokens):
   ```bash
   pnpm capture <ComponentName> [FixtureName] --states --inspect-styles
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
pnpm capture [Component] [Fixture] [options]
```

Options:
- `-e, --eval <code>`: Run inline async interaction script with `{ page, canvas, root, target, interactive, capture, pressTab, inspectStyles, wait, frame }`.
- `-s, --script <path>`: Run custom `.mjs` script file exporting `default async function({ page, canvas, root, target, interactive, capture, pressTab, inspectStyles, wait, frame })`.
- `-l, --list`: List all available fixtures for a component, or list all components in the repo if component is omitted.
- `--states`: Multi-state capture (`Resting`, `Hover`, `Focus (Click)`, `Tab`, `Open`).
- `--inspect-styles`: Dumps a computed styles table (outline, border, box-model) across states or for target.
- `--target <css>`: Specific element to snapshot (auto-defaults to `[data-reference-field]`, then fixture root, then canvas).
- `--pad <px>`: Padding around the bounding box to preserve focus rings, shadows, and outlines (default `20`).
- `--out-dir <dir>`: Directory where screenshots will be stored (default: `.reference-ui/captures/`).
- `--viewport <WxH>`: Custom viewport dimensions (default `1600x1050`).

Script Context Helpers:
- `canvas`: `[data-book-canvas]` story host locator in the single Book document.
- `root`: Alias of `canvas` (story root).
- `frame`: Deprecated compat alias for `page` / `canvas`.
- `pressTab([locator])`: Simulates native keyboard tab with outline-preserving DOM shim.
- `inspectStyles([locatorOrSelector])`: Returns computed border, outline, box-model properties.

Output:
- Saves unclipped, focus-ring-safe images of component + popovers to workspace directory.
- Automatically syncs to Antigravity brain directory for direct rendering in chat.
- Emits markdown snippets and tables ready to paste directly into chat messages and `walkthrough.md`.
