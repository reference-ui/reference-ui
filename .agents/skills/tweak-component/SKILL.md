---
name: tweak-component
description: Autonomous workflow for inspecting, tweaking, styling, and visually verifying components in @reference-ui/lib against Book stories (*.book.ts / *.book.tsx), returning visual screenshots, and passing Vitest/Playwright test contracts. Activate whenever the user asks to polish, style, fix, or improve how a component feels or looks.
---

# Component Tweaking & Manufacturing Skill (`tweak-component`)

Use this skill when tasked with fixing, implementing, or visually polishing any component in `@reference-ui/lib`.

If the work also changes `packages/reference-core`, this skill is not enough. After the component loop, follow **test-core** (`.agents/skills/test-core/SKILL.md`) — the pipeline runner (`pnpm agent`). test-core is **not a skill**.

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
- Driver: `SPEC.md` (freeze, gaps, proof). Case catalog: `TESTS.md` when SPEC points at it.

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
Execute targeted checks locally (never run raw unthrottled subshell commands or global `pnpm test` wrappers):

```bash
# Component verification loop (unit → e2e + videos + visual snapshots):
# Follow the test-component skill: inspect videos and snapshot diffs after the run.
# Never --update-snapshots here. Snapshot writes need an explicit human yes.
pnpm agentct <ComponentName>
# e.g.: pnpm agentct Popover
pnpm agentct Popover --unit
pnpm agentct Popover --e2e
pnpm agentct Popover --e2e --react all

# Recommended for full 4-phase matrix verification in one shot (test-core, not a skill):
# (Typecheck -> vitest -> build -> targeted Playwright spec)
# If you also changed packages/reference-core, follow test-core first.
pnpm agent verify <ComponentName>
# e.g.: pnpm agent verify Toast

# Fast Native Iteration (spec tests & greps without full pipeline overhead):
# (Automatic PRI 46 QoS, port 4173 cleanup, queue locks, and exit pass signals)
pnpm agent playwright overlays -g "OV-OUT"
pnpm agent playwright overlays -g "OV-LAYER"
pnpm agent playwright lib tests/e2e/<component>.spec.ts
pnpm agent pw -g "OV-OUT"

# Targeted Unit Tests (Vitest):
pnpm agent vitest lib -t "<Component>"
pnpm agent vt packages/reference-lib/src/components/<Component>/__tests__/<Component>.test.tsx
```

> [!NOTE]
> Matrix playwright tests consume `@reference-ui/lib` from `dist/index.mjs`.
> `pnpm agent playwright` automatically checks if `dist/index.mjs` is present and builds it if missing, ensuring tests never run against stale artifacts. To force a rebuild, pass `--build`.

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
4. Update `SPEC.md` (or `TESTS.md`) by marking Playwright-proven items as `- [x] <PREFIX>-...`.
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

---

## 4. Case index

Full-text index over neo cases + RS module surfaces (names, full README
text, `specs/*.spec.ts`, RS suite/case inventory). The README is the
index: write it detailed and the index is good.
Use it to find **related neo cases / RS
surfaces for the feature being polished**, instead of grepping.

```bash
pnpm agent:cases search "<query>" [--limit=N] [--json] [--compact]  # search cases + surfaces
pnpm agent:cases list [--kind=neo|rs] [--json]          # list indexed docs (auto-rebuilds if stale)
pnpm agent:cases reindex [--json]                       # force rebuild
# direct: node .agents/case-index/cli.mjs search <query> | list [--kind=neo|rs] | reindex
```

Terms are stemmed (`queries` matches `query`) and typo-tolerant
(fuzzy+prefix, with "did you mean" on zero hits); `search` caps at 15
hits unless `--limit=N` raises it; `--compact` prints headers only, and an exact id query returns just that doc. There is no metadata sidecar —
enrich the index by writing a detailed README: describe the behavior,
name the symbols, cite sibling case/station ids (cited ids surface as
`related`).

Example (RS surface hit):

```text
$ pnpm agent:cases search "barrels" --limit=1
11.241  rs:atlas — Atlas Module [rs:atlas] (matched: barrel)
        packages/reference-rs/modules/atlas
        related: rs:tasty, rs:styletrace, rs:shared
# Atlas Module
Atlas is the component discovery, props interface mapping, […]
> Search terms: discovery, call-site analysis, barrels, […]
[…]
```
