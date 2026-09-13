---
name: test-component
description: Component verification skill for @reference-ui/lib only. Runs colocated Vitest unit tests first, then Playwright CT in __e2e__ with video, screenshots, and visual snapshots. Switch React 17/18/19 locally with --react (Vite aliases, no pipeline). Snapshot baseline updates require genuine styling changes and explicit human verification (--confirm). Activates whenever a component's logic, behavior, interactions, presence, visual drift, or motion needs to be verified. If packages/reference-core was modified, hand off to test-core (the pipeline runner, not a skill) — do not use this skill for core.
---

# Component Testing Skill (`test-component`)

Use this skill whenever you need to **verify whether a component passes logic, behavior, and visual/motion requirements**.

`test-component` is a **pure verification skill**. It does not manage feature development or refactoring; higher-level workflows call it as their verification gate.

### Scope: `@reference-ui/lib` only

This skill covers colocated Vitest + Playwright CT for components in `packages/reference-lib`. It does **not** cover `packages/reference-core`, matrix packages, or the pipeline.

If you modified `packages/reference-core` (Vite plugin, Playwright host, sync, packager, types, Book discovery, React runtime aliases, virtual FS, MCP, …), **stop here** and follow **test-core** (`.agents/skills/test-core/SKILL.md`). That is the pipeline runner (`pnpm agent`). It is **not a skill** — it is the core/matrix verification harness. `pnpm agentct` will not prove a core change.

---

## Where Tests Live

| Kind | Location | Runner |
| --- | --- | --- |
| Unit | Colocated next to source: `src/components/<Component>/*.test.ts(x)` | Vitest |
| Component E2E | `src/components/<Component>/__e2e__/<Component>.ct.spec.ts` | Playwright CT |
| Stories (CT fixtures) | `src/components/<Component>/<Component>.story.tsx` | Mounted by CT |
| Visual snapshots | `src/components/<Component>/__e2e__/__snapshots__/*.png` | Playwright `toHaveScreenshot` |

Unit tests sit beside the code they cover. `__e2e__` is separate because those files are Playwright component tests against a real browser, not Vitest files.

Matrix contract tests in `matrix/*/tests/e2e` are a different layer (cross-bundler/runtime). Do not put component CT there.

---

## What To Write Where

**Vitest (unit)** is for logic and functionality that does not need a browser:

- Pure functions, state machines, math, parsing, formatting, token merge
- SSR markup contracts (`renderToString`)
- Pointer/capability helpers, queue ordering, ID generation

Do **not** emulate the DOM in Vitest when you do not need to. Do not write JSDOM click/hover/focus theater for overlays, focus traps, or presence. If the assertion needs a real layout, pointer, keyboard, animation, or screenshot, it belongs in `__e2e__`.

**Playwright CT (`__e2e__`)** is where most "real" component tests live:

- Open/close, hover, Escape, outside click, focus return
- Presence enter/exit, anchoring, safe polygon travel
- Visual snapshots at settled states (resting / open / dismissed)
- Video of the interaction for motion review

---

## The Verification Loop

```mermaid
flowchart LR
    A[Unit Vitest] --> B[E2E Playwright CT]
    B --> C[Inspect videos]
    C --> D[Inspect snapshot diffs]
    D --> E[Verdict]
```

Always run **unit first**, then e2e on React 19, then inspect artifacts. From the repository root:

```bash
pnpm agentct                         # Run ALL components through the 3-slot daemon
pnpm agentct Popover                 # unit → e2e (React 19 + snapshots)
pnpm agentct Popover --unit
pnpm agentct Popover --e2e
pnpm agentct Popover --e2e --react 18
pnpm agentct Popover --e2e --react 17,19
pnpm agentct Popover --e2e --react all
pnpm agentct Popover --list                 # List tests (no queue slot used)
pnpm agentct Popover "OV-POS-10"            # Run an exact spec by its ID (ergonomic positional argument)
pnpm agentct Popover --id "OV-POS-10"       # Same as above
pnpm agentct Popover --line 509             # Deterministic line number targeting (useful for AI agents)
pnpm agentct Popover -g "escape"            # Fuzzy fallback (avoid if possible)
pnpm agentct daemon                         # Optional: keep Vite warm in your terminal
pnpm agentct stop                           # Stop the auto/persistent daemon
pnpm agentct --help
```

> [!IMPORTANT] 
> **AGENTIC FLOW & PERSISTENT DAEMON:**
> - **NEVER pass the `--json` flag.** The user wants to see the human-readable progress in the task logs. Run `pnpm agentct` natively and parse the terminal output.
> - **One Vite, three slots:** `agentct` auto-starts a persistent Unix-socket daemon (`/tmp/ref-ct-agent.sock`) that owns a single CT Vite gallery on `http://localhost:3101`. Concurrent `pnpm agentct <Component>` invocations from subagents **must** go through this daemon — they must not boot their own Vite servers.
> - **Global queue:** hard-capped at **3** parallel execution slots. Each Playwright run gets `Math.floor(os.cpus().length / 3)` workers so three concurrent slots cannot exceed 100% CPU.
> - **You CAN and SHOULD** invoke multiple `pnpm agentct <Component>` runs concurrently in separate subagents. They queue on the warm server; extra jobs wait for a free slot.
> - **Snapshot telemetry:** when `toHaveScreenshot` fails, the reporter prints bounding box (`x: min..max`, `y: min..max`) and the dominant color hex difference. Use that before writing image-parsing scripts.
> - **Triaging Full Suite Failures:** To run the whole suite, execute `pnpm agentct` (no arguments). Once finished, read the console failures, then spawn an independent subagent PER FAILED COMPONENT to fix it, run `pnpm agentct <FailedComponent>` to verify, and report back.

Never pass `--update-snapshots` during this loop. Snapshot writes are a separate, human-gated step (see below).

The runner unthrottles Darwin QoS (`PRI 46`), runs colocated Vitest under `packages/reference-lib`, then Playwright CT against `packages/reference-lib/playwright/playwright.config.ts`. There is **no need** for `pnpm dev:lib` on port 5000 — CT uses the daemon's gallery on `http://localhost:3101`. A global `beforeEach` resets `window.scrollTo(0, 0)` so large fixtures cannot leak scroll into the next test. Do not kill port 3101 between agentct jobs; the daemon owns that process. Use `pnpm agentct stop` when you want it gone.

### React runtimes (no pipeline)

Matrix tests switch React via **test-core** (`pnpm agent` / Dagger). CT does **not**. `--react` points the CT Vite gallery at isolated `@ct-runtime/react-*` packages under `packages/reference-lib/playwright/runtimes`:

| Flag | Package | Mount |
| --- | --- | --- |
| default / `--react 19` | `@ct-runtime/react-19` | `createRoot` |
| `--react 18` | `@ct-runtime/react-18` | `createRoot` |
| `--react 17` | `@ct-runtime/react-17` | `ReactDOM.render` (`react-dom/client` + `useId` / `useSyncExternalStore` shims) |

`html[data-react-version]` is set from `React.version` so you can confirm the runtime.

**When to use `--react`**
- Day to day: omit it. `pnpm agentct <Component>` is React 19 + snapshots.
- After overlay / presence / event / mount work, or when the human asks about compatibility: `--e2e --react all` (or `17,18`).
- Unit tests always use workspace React 19. `--react` is e2e-only.
- Visual snapshots (`snap()`) run **only on React 19**. 17/18 are behavioral. `snap()` is a no-op off 19, so specs stay identical.
- Do not pass `--update-snapshots` with `--react 17`, `18`, or `all`. The runner refuses.

If the change that forced a React/host tweak lives in `packages/reference-core`, prove it with test-core (`pnpm agent`), not this loop.

Human pairing: `pnpm playbook` opens the Playwright UI.

---

## Artifact Inspection (mandatory)

The runner prints absolute paths after e2e:

```text
✔ [PASSED] react19 popover opens on trigger click and closes on outside click (845ms)
  🎥 Video:      /path/to/.../video.webm
  📸 Screenshot: /path/to/.../test-finished-1.png

✖ [FAILED] react18 tooltip opens on hover ...
  🎥 Video:      /path/to/.../video.webm
```

### Videos (`.webm`)

Call `view_file` on each `video.webm`. Check:

1. **Presence & exit** — overlay enters with its animation; on dismiss it finishes the exit before unmount (no snap/flicker).
2. **Anchoring** — position vs trigger, arrow alignment, no jitter on flip.
3. **Focus** — `:focus-visible` rings visible; focus returns to the trigger.
4. **Pointer travel** — hover overlays stay open across the safe area.
5. **Layout** — no unexpected shifts or scroll jumps.

### Visual snapshots (drift)

Snapshots are **settled-state** comparisons (`snap(page, 'open')`, stored as `open.png`). Animations are disabled for the comparison so the check is about layout/paint drift, not motion (motion is the video). `snap()` no-ops unless the CT gallery is React 19.

On mismatch: read the **bbox + color telemetry** in the terminal, then `view_file` the **diff**, then **actual**, then **expected**. Treat a failed snapshot as a **regression until the human says otherwise**. Fix the component. Do **not** update the baseline.

---

## Updating snapshots (human-gated)

Only update snapshots if they are genuinely updating styling, and it always has human verification.

`--update-snapshots` is forbidden unless all of the following are true:

1. The change is **genuine styling** — tokens, spacing, color, typography, chrome, or intended layout. Not a logic fix, flake, timeout, animation timing, font raster, or harness tweak.
2. You have shown the human **expected**, **actual**, and **diff** in chat (embed the images).
3. You have **stopped** and asked: *“This looks like an intentional styling update. Update the snapshot baselines?”*
4. The human has replied with an **explicit yes**. Silence, “looks fine”, or a later commit request is not approval.

Until that yes: do not run `--update-snapshots`, do not pass `--confirm`, do not copy pngs into `__snapshots__` by hand.

After an explicit yes:

```bash
pnpm agentct <Component> --e2e --update-snapshots --confirm
```

`--confirm` is the machine record that the human already approved. The runner refuses `--update-snapshots` without it, and refuses it with `--react 17`, `18`, or `all`.

Then show the new baselines in chat and wait if the human wants a second look.

---

## Structured Verdict

Return:

1. **Unit** — passed/failed, what logic was covered (always workspace React 19).
2. **E2E** — total / passed / failed, **per React major** (`react17` / `react18` / `react19`).
3. **Artifact paths** — videos, screenshots, snapshot expected/actual/diff (snapshots only on 19).
4. **Motion notes** — timestamped observations from the video.
5. **Drift notes** — if snapshots failed, what changed (spacing, color, missing arrow, etc.).
6. **Runtime notes** — if `--react` was used, say which majors ran and that paint drift was not compared off 19.
7. **Handoff** — `pnpm playbook` for interactive debugging.

Do not update snapshot baselines as part of the verdict. That is a separate human-gated step.

---

## Authoring

### 1. Unit (`src/components/<Component>/*.test.ts`)

```ts
import { describe, expect, it } from 'vitest'
import { isHoverCapablePointer } from './hover'

describe('hover pointer capability', () => {
  it('treats mouse as hover-capable and touch as not', () => {
    expect(isHoverCapablePointer({ pointerType: 'mouse' })).toBe(true)
    expect(isHoverCapablePointer({ pointerType: 'touch' })).toBe(false)
  })
})
```

### 2. Story (`src/components/<Component>/<Component>.story.tsx`)

```tsx
import * as React from 'react'
import { Div, Button } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Popover } from './index'

export const ClickToOpen = () => (
  <ReferenceLibrary>
    <Div p="4r" colorMode="dark">
      <Popover>
        <Popover.Trigger variant="primary">Open popover</Popover.Trigger>
        <Popover.Content placement="bottom-start" offset={8}>
          Popover title
        </Popover.Content>
      </Popover>
    </Div>
  </ReferenceLibrary>
)
```

### 3. E2E spec (`src/components/<Component>/__e2e__/<Component>.ct.spec.ts`)

Import `test`, `expect`, and `snap` from the CT fixture. Mount stories as `components/<Component>/<Component>/<StoryExportName>`. Snapshot settled frames; let the video cover motion. Leave `snap()` in the spec even for `--react 17/18` — it no-ops off 19.

```ts
import { test, expect, snap } from '../../../../playwright/ct'

test('popover opens on trigger click', async ({ mount, page }) => {
  const component = await mount('components/Popover/Popover/ClickToOpen')
  const trigger = component.getByRole('button', { name: 'Open popover' })
  const content = page.getByText('Popover title')

  await snap(page, 'resting')
  await trigger.click()
  await expect(content).toBeVisible()
  await page.waitForTimeout(300)
  await snap(page, 'open')

  await page.keyboard.press('Escape')
  await expect(content).not.toBeVisible()
})
```

---

## Developer Interactive UI (`playbook`)

```bash
pnpm playbook
```

Native Playwright UI with live story rendering, locators, and time-travel.
