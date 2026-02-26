# reference-test Plan

End-to-end testing for Reference UI design system **output**. Tests that users can define design tokens, fonts, keyframes, etc. in `ui.config.ts` and use them in a real app with correct CSS applied.

---

## Philosophy

**We test the output, not the CLI.**

The CLI is a means to an end. What we're testing:

- Can a user define tokens in `ui.config.ts`?
- Do those tokens generate correct CSS?
- Does the app render with styles applied?
- If they change the config, does watch mode react?
- Does it work across React versions and bundlers?

**Black-box testing**: We don't care about the CLI's internal pipeline. We care that when a user writes:

```ts
// ui.config.ts
export default defineConfig({
  theme: {
    tokens: {
      colors: { brand: { value: '#ff0000' } },
    },
  },
})
```

And uses it:

```tsx
<Box css={{ color: 'brand' }}>Hello</Box>
```

The output is a **red box**.

---

## Scope

### In scope

- **Design system output validation**: Do tokens/fonts/keyframes generate correct CSS?
- **Runtime integration**: Does the CSS apply to rendered components?
- **Watch mode behavior**: Does config change trigger rebuild and update?
- **Environment matrix**: React versions, bundlers—does the output work everywhere?

### Out of scope

- **CLI internal testing**: Pipeline mechanics, config loader, event bus—these are implementation details
- **Component library tests**: Testing `Button` behavior—that's a separate concern
- **Browser compatibility**: Multi-browser rendering—handled by existing tools (Playwright)

---

## Pipeline

```
generate test app → define design system → run CLI → render + assert → change + assert
```

### 1. Generate test app

Scaffold a minimal app with a given environment:

| Parameter       | Examples                          |
| --------------- | --------------------------------- |
| React version   | 18, 19                            |
| Bundler         | vite, webpack, rollup, esbuild, … |
| Bundler version | e.g. vite@5, vite@6               |

Output: a temp project with:

- `package.json` (React, bundler deps)
- `ui.config.ts` (test fixture—tokens, fonts, keyframes, etc.)
- `App.tsx` (components using the design system)
- Minimal HTML entry point

### 2. Run CLI sync

Execute `ref sync` (or watch mode) to generate the design system.

Expected output:

- `styled-system/` directory
- CSS files
- TypeScript types

### 3. Build and render

Build the app with the bundler, then render it (jsdom, Playwright, or similar).

### 4. Assert output

Inspect the rendered DOM and computed styles:

- **Token application**: Is `<Box css={{ color: 'brand' }}>` rendered with correct color?
- **Font loading**: Do custom fonts appear in computed styles?
- **Keyframes**: Do animations reference the defined keyframes?
- **Responsive tokens**: Do breakpoints work?
- **Type safety**: Does TypeScript compilation succeed?

### 5. Dynamic change testing (watch mode)

Modify `ui.config.ts` (e.g., change `brand` color from red to blue), wait for rebuild, re-render, assert the change applied.

---

## Concepts

### Project generators

Config-driven project scaffolding. Each generator produces a project for one (React, bundler, bundlerVersion) tuple.

- `generate(env: { reactVersion, bundler, bundlerVersion }) → ProjectPath`
- Project is isolated (temp dir or workspace subdir)
- Cleaned up after test run (or kept for debugging)

### Test suite

The suite lives in reference-test (or imports tests from reference-core). It:

1. Assumes it’s running inside a generated project (cwd = project root)
2. Exercises: load config, run `ref sync`, trigger build, maybe smoke a minimal page
3. Does not depend on a specific React/bundler—uses whatever the generated project has

### Matrix

Define which combinations to run:

```ts
// Example matrix
const matrix = [
  { react: '18', bundler: 'vite', bundlerVersion: '^5' },
  { react: '18', bundler: 'vite', bundlerVersion: '^6' },
  { react: '19', bundler: 'vite', bundlerVersion: '^6' },
  { react: '18', bundler: 'webpack', bundlerVersion: '5' },
  // ...
]
```

CI runs the full matrix (or a subset). Each combination: generate → run suite → pass/fail.

---

## How: Test Fixtures & Apps

**Fixtures** = `ui.config.ts` files with different design system features:

- Minimal tokens (colors, spacing)
- Font definitions (custom families, weights)
- Keyframes (animations)
- Complex scenarios (nested tokens, responsive values)

**Apps** = React components that consume the design system:

- Basic: Use tokens via `css({ color: 'brand' })`
- Fonts: Render text with custom font families
- Animations: Use keyframes in animations
- Comprehensive: Exercise multiple features at once

---

## How: Assertions

We need to verify **three things**:

### 1. Build succeeds

- `ref sync` completes without error
- TypeScript compilation succeeds
- Bundler build produces output
- Expected files exist (`styled-system/css.mjs`, etc.)

### 2. Runtime output is correct

- Render the app (Playwright)
- Inspect DOM: correct classes applied
- Inspect computed styles: `color: rgb(255, 0, 0)` when token is `#ff0000`
- CSS variables defined: `--colors-brand` exists
- Fonts loaded: `font-family` matches custom font
- Animations work: keyframe references valid

### 3. Watch mode reacts to changes

- Start `ref sync --watch`
- Modify `ui.config.ts` (change token value)
- Wait for rebuild signal
- Re-render app
- Assert new value applied

---

## How: Rendering

We need a **real browser** to inspect computed styles correctly.

**Playwright** is the right tool here:

- Full browser environment (Chromium/Firefox/WebKit)
- Accurate CSS computation (variables, fonts, animations)
- Can wait for resources (fonts, CSS loads)
- Good API for style inspection: `page.locator().evaluate(el => getComputedStyle(el))`

**Flow:**

1. Generator produces project
2. Run `ref sync` in project
3. Build project with bundler
4. Start dev server (or serve built output)
5. Playwright navigates to app
6. Inspect DOM + computed styles
7. Assert values match expected

---

## How: Watch Mode Testing

Watch mode is a **critical user workflow**: change config, see changes immediately.

**Scenario:**

1. User runs `ref sync --watch`
2. Changes `ui.config.ts` (e.g., `brand: red` → `brand: blue`)
3. Expects: rebuild happens, app reflects new value

**Test approach:**

- Start watch process in background
- Modify fixture file (change token value)
- Wait for rebuild to complete (file watcher signal, event, or time-based)
- Playwright re-inspects the same element
- Assert computed style changed from old to new value

**Open questions:**

- How to detect rebuild completion? (File watcher? Event emission? Polling?)
- Does the app need manual refresh or does HMR work?
- How long to wait before considering rebuild failed?
- Process cleanup: ensure watch process terminates after test
