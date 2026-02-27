# reference-test Architecture

Playwright-based E2E tests for the reference-ui design system. One test suite runs against a generated sandbox app to verify ref sync, component rendering, and style application.

---

## Current Structure

```
packages/reference-test/
├── src/
│   ├── app/                    # Base app template (Vite)
│   │   ├── App.tsx
│   │   ├── main.tsx            # React 18+ (createRoot)
│   │   ├── main.react17.tsx    # React 17 (render)
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── ui.config.ts
│   │   └── tsconfig.json
│   ├── matrix.ts               # Matrix config (React × Bundler)
│   ├── prepare.ts              # Generates all sandboxes
│   ├── run-matrix.ts           # Runs Playwright per project (webServer workaround)
│   ├── tests/
│   │   └── core-system.spec.ts  # Single test suite (same for all entries)
│   └── index.ts
├── .sandbox/                   # Generated sandboxes (gitignored)
│   ├── react17-vite5/
│   ├── react18-vite5/
│   └── react19-vite5/
├── playwright.config.ts
└── package.json
```

---

## Flow

1. **test:prepare** — `prepare.ts` generates all matrix sandboxes:
   - For each matrix entry: copies `src/app` → `.sandbox/{entry}/`
   - Writes entry-specific `package.json` (React version, Vite version, @reference-ui/core)
   - Uses `main.react17.tsx` for React 17, `main.tsx` for React 18+
   - Runs `pnpm install --ignore-workspace` and `ref sync` in each
2. **run-matrix.ts** — Runs Playwright once per project (Playwright has no per-project webServer):
   - Sets `REF_TEST_PROJECT={entry}` so config uses `.sandbox/{entry}` for webServer.cwd
   - `playwright test --project=react18-vite5` etc.
3. **Tests** — Same assertions for every matrix entry; `getSandboxDir()` uses `REF_TEST_PROJECT`

---

## Test Suite

The tests in `src/tests/` are **environment-agnostic**:

- **ref sync produces expected artifacts** — Checks `.sandbox/{project}/node_modules/@reference-ui/` for sync output
- **app renders with reference-ui components** — Asserts `data-testid="app-box"` visible with "Hello"
- **reference-ui styles are applied** — Asserts `color` is in `oklch()` format (design tokens applied)

These tests must pass for **every** matrix combination. No environment-specific test logic.

---

## Matrix Plan

### Goal

One test suite. Many environments. Run the same Playwright tests across:

- **React**: 17, 18, 19
- **Bundlers**: Vite (4, 5), Webpack 5 (future: other majors)

### Approach Options

#### Option A: Sequential runs (simplest)

- **prepare** accepts a `REF_TEST_MATRIX_ENTRY` env var (e.g. `react18-vite5`)
- **prepare** generates `.sandbox` for that entry only
- Run Playwright
- CI loop: for each matrix entry, `REF_TEST_MATRIX_ENTRY=... pnpm test`
- **Pros**: Same codebase, no Playwright config changes, easy to add entries
- **Cons**: Serial execution, slower CI

#### Option B: Playwright projects (chosen)

- **prepare** runs once per matrix entry, outputting to `.sandbox/react18-vite5`, `.sandbox/react17-vite5`, etc.
- Each sandbox is a **full project** with its own `package.json`, `node_modules`, and ref sync output
- Playwright config defines one **project** per matrix entry
- Each project: `webServer.cwd: '.sandbox/react18-vite5'`, `webServer.port: 5174` (or per-project port for parallel)
- **Yes, different package.json per project** — prepare generates each sandbox with entry-specific deps (e.g. `react@17.0.2` + `vite@5.x` for react17-vite5, `react@18.3.1` for react18-vite5)
- **Pros**: Native Playwright, parallel or sequential, each entry fully isolated
- **Cons**: Multiple sandboxes on disk. Playwright has no per-project webServer, so we run each project separately via `run-matrix.ts` (sets `REF_TEST_PROJECT` so config picks the right sandbox)

#### Option C: Sharded CI (parallel, one sandbox per shard)

- CI shards (e.g. GitHub Actions matrix): `shard: 1/6`, `shard: 2/6`, …
- Each shard maps to a matrix entry
- Each shard runs `REF_TEST_MATRIX_ENTRY=react18-vite5 pnpm test` (or similar)
- **Pros**: True parallel CI, one sandbox per job, no port conflicts
- **Cons**: Requires CI matrix config

### Recommended: Option B

- **prepare** generates all matrix sandboxes up front (`.sandbox/{entry}/` each with its own `package.json`)
- Playwright runs one project per entry; can use `workers: 1` (sequential, one port) or parallel with per-project ports

---

## Matrix Entries (to implement)

| Entry        | React | Bundler      | Notes                        |
|--------------|-------|--------------|------------------------------|
| react17-vite5| 17    | Vite 5       |                              |
| react18-vite5| 18    | Vite 5       | **Current default**          |
| react19-vite5| 19    | Vite 5       |                              |
| react18-vite4| 18    | Vite 4       |                              |
| react18-webpack5| 18  | Webpack 5    | Future                       |

---

## Prepare Changes for Matrix (Option B)

1. **matrix config** — Define entries: `{ name, react, bundler, bundlerVersion }`
2. **prepare.ts** — Generates **all** sandboxes: `.sandbox/react17-vite5/`, `.sandbox/react18-vite5/`, etc.
3. **sandbox layout** — `.sandbox/{entry}/` — each is a full project with its own `package.json`, `node_modules`, ref sync output
4. **package.json per entry** — prepare builds entry-specific deps (e.g. `react@17.0.2`, `vite@5.x` for react17-vite5; `react@18.3.1` for react18-vite5; Webpack 5 deps when added)
5. **Base app variants** — `src/app/` stays as Vite. Add `src/app-webpack/` when Webpack support is added, or parameterize a single template.

---

## Adding a New Matrix Entry

1. Add entry to matrix config
2. Ensure base app template works with that React + bundler (or add variant)
3. Add CI job if using matrix strategy
4. No test changes — same Playwright specs run for all entries
