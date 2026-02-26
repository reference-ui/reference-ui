# reference-test Plan

End-to-end and compatibility testing for Reference UI. Tests that `@reference-ui/core` (CLI, config, bootstrapping) works across multiple environments.

---

## Scope

### In scope

- **Core bootstrapping**: Does `ui.config.ts` load? Does `ref sync` work? Does the virtual layer, system, packager pipeline run?
- **Environment matrix**: React versions, bundlers, bundler versions
- **Host for React-version testing**: CI/browser tools can handle multi-browser, but testing across React 18 vs 19 vs future is a custom demand—reference-test owns this

### Out of scope

- **Component tests**: Higher-level UI component tests (rendering, a11y, etc.)—separate concern. CI tools (Playwright, etc.) handle multi-browser for those. reference-test focuses on "does the stack boot?" not "does Button render correctly?"

---

## Pipeline

```
generate project → run test suite inside project
```

### 1. Project generator

Scaffold a minimal project with a given environment:

| Parameter      | Examples                                   |
|----------------|--------------------------------------------|
| React version  | 18, 19                                     |
| Bundler        | vite, webpack, rollup, esbuild, …          |
| Bundler version| e.g. vite@5, vite@6                        |

Output: a temp/workspace project with:

- `package.json` (React, bundler deps pinned)
- `ui.config.ts` (minimal)
- Entry file that imports something from reference-core
- Enough structure for `ref sync` + bundler build to run

### 2. Run test suite

Inside the generated project:

- Run the test suite (tests from reference-core, or dedicated e2e tests in reference-test)
- Assert: config loads, sync succeeds, build completes, no runtime errors

The same tests run in each generated environment. Success = same assertions pass across all combinations.

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

## Architecture (proposed)

```
reference-test/
├── src/
│   ├── generate/           # Project generators
│   │   ├── vite.ts
│   │   ├── webpack.ts
│   │   └── index.ts        # generate(env) → path
│   ├── matrix/             # Environment matrix config
│   │   └── index.ts
│   ├── suite/              # Tests that run inside generated projects
│   │   ├── config.test.ts
│   │   ├── sync.test.ts
│   │   └── ...
│   ├── run.ts              # Orchestrator: for each matrix entry → generate → run suite
│   └── cli.test.ts         # Smoke test (current)
├── plan.md
└── ...
```

---

## Implementation order

1. **Project generator (vite only)** — Minimal: React 18 + Vite 5. Hardcode first, parameterize later.
2. **Suite: config + sync** — Tests that run inside generated project: config loads, `ref sync` succeeds.
3. **Parameterize generator** — React version, Vite version as args.
4. **Matrix runner** — Loop over matrix, generate, run, report.
5. **Add more bundlers** — webpack, rollup, etc., as separate generators.
6. **CI integration** — Wire matrix into CI, cache, parallelize.

---

## Browser testing

reference-test does **not** run browser tests. It validates:

- Config loads
- CLI works
- Build completes

Rendering and cross-browser behavior are covered by component tests and existing CI (Playwright, etc.). reference-test’s job is: “Does the stack boot in environment X?”
