# Testing `@reference-ui/lib`

This is the process for proving foundation and ARIA primitives in this package.

Implementation lives here. Proof lives in `matrix/lib`. That split is intentional: the core matrix already tests the compiler, tokens, CSS, and generated runtime. Component work must not ride that path.

The API and freeze-gate contracts are in [`src/components/components.md`](./src/components/components.md). Cosmos is the visual playground. Playwright is the proof.

## Where things live

| Concern | Location |
| --- | --- |
| Primitive source | `packages/reference-lib/src/components/` |
| API / freeze gates | `packages/reference-lib/src/components/components.md` |
| Visual playground | Cosmos in this package (`pnpm run cosmos` / `pnpm run dev:lib`) |
| Component proof | `matrix/lib` |

`matrix/lib` is a matrix package that consumes the public `@reference-ui/lib` API the way an application would.

If a primitive only passes when a test imports `../../src/...` internals, the public API is not frozen.

## Playwright first

Agents proving a primitive run Playwright.

Focus containment, portals, Escape, outside press, hover intent, roving tabindex, and APG keyboard contracts are browser behaviour. That is the bar.

Vitest is not part of the default component loop. Use it later for pure contracts (Slot merge rules, Calendar grid math, toast queueing) if a file does not need a browser. Do not stand up a parallel unit suite in order to start Overlay.

## Agent loop

Work one primitive at a time. Do not run `pnpm pipeline test`. Do not run this fixture's `pnpm test` if it routes through the pipeline.

```bash
cd matrix/lib
pnpm exec playwright test tests/e2e/overlay.spec.ts
```

All primitives in this fixture:

```bash
cd matrix/lib
pnpm exec playwright test
```

A single contract inside a spec:

```bash
cd matrix/lib
pnpm exec playwright test tests/e2e/overlay.spec.ts -g "Escape dismisses the topmost layer"
```

That command must stay fast: host Playwright, workspace React, one spec file, existing `node_modules`. No Dagger, no registry, no Webpack.

If generated primitives are stale, sync this package only (`pnpm run sync` here), then re-run the spec.

## Pipeline: one package, cheaper params

Pipeline can run a single matrix package. Extra flags shrink that job for a quicker isolated run — for example pinning one React version instead of expanding every declared runtime.

```bash
pnpm pipeline test
pnpm pipeline test --packages=@matrix/lib
pnpm pipeline test --packages=@matrix/lib --react=react19
pnpm pipeline test --packages=@matrix/lib --react=react17
pnpm pipeline test --packages=@matrix/lib --full
```

| Command | What runs |
| --- | --- |
| `pnpm pipeline test` | Every matrix package, each in its default environment |
| `--packages=@matrix/lib` | Only this package, first declared React, preferred bundler |
| `--react=react19` (or `17` / `18`) | The same selection, pinned to one declared React |
| `--full` | Every declared React × bundler for the selected package(s) |

`--packages` and `--react` are general pipeline params, not a special path for this fixture. `@matrix/lib` stays Vite-only because `matrix.json` lists `vite7`, not because pipeline treats it differently.

`--react` must be a runtime that package declared. Two Reacts cannot share this workspace `node_modules`; compatibility jobs still go through the usual Dagger consumer.

## Harness shape

`matrix/lib` follows the same layout as other matrix packages, with one spec and one demo per primitive:

```text
matrix/lib/
  matrix.json
  src/
    overlay.tsx
    popover.tsx
    ...
  tests/e2e/
    overlay.spec.ts
    popover.spec.ts
```

- File name is the control plane. `--component=overlay` is optional sugar later, not a second selection model.
- The Vite app is a small router: `/overlay`, `/popover`, and so on. Each spec `goto`s its page.
- Demo pages are freeze-gate compositions from `components.md` (for Overlay: dialog, alertdialog, drawer — not a kitchen sink).
- An unfinished Combobox must not block Overlay. Skip or omit the missing spec; do not couple primitives in one file.

`matrix.json` should declare the compatibility array explicitly. Default resolution is the first entry — put the daily runtime first (`react19` today):

```json
{
  "name": "lib",
  "bundlers": ["vite7"],
  "react": ["react19", "react18", "react17"]
}
```

## React versions

React 19 is current and is the **base** for the agent loop. The suite still has to prove 17 and 18.

| Mode | React | How |
| --- | --- | --- |
| Default / agent | **19** | Host Playwright against the workspace install |
| Compatibility | **17, 18, 19** | `pipeline test --packages=@matrix/lib` with `--react` or `--full` |

Do not expand 17/18 on the host agent loop.

## What not to do

- Do not prove Overlay through `@matrix/playwright`, `@matrix/primitives`, or any compiler fixture.
- Do not put the component harness inside this package's Cosmos fixtures. Cosmos is for looking; `matrix/lib` is for asserting.
- Do not route the daily `matrix/lib` loop through Dagger. That is what makes the core matrix slow.
- Do not treat `--full` on the repo as the way to run these tests.

## Suggested primitive order

Follow `components.md`. Finish the foundation before the ARIA set, and keep each agent on one spec:

1. `Portal`, `Presence`, `Slot`, `RovingFocus`
2. `Overlay`, `Popover`, `Toast` / `ReferenceLibrary`
3. `Listbox`, `Menu`, `Tree`, `Combobox`, `Tabs`
4. `Slider`, `Switch`, `Collapsible`, `Accordion`
5. `Tooltip`, `Splitter`, `Calendar`
