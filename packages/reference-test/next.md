# Next: Vitest Projects for Matrix Testing

~~Implement~~ **Implemented** Option B — Vitest native `projects` to run the same tests across different generated environments.

---

## What we built

- **Matrix:** React 17, 18, 19 × Vite (one bundler for now)
- **Per-project ui.config.ts:** `environments/configs/{projectName}/ui.config.ts` — customize per matrix entry
- **Sandbox isolation:** `.sandbox/react17-vite`, `.sandbox/react18-vite`, `.sandbox/react19-vite`
- **Commands:** `pnpm test` (full matrix), `vitest run --project react18-vite` (single env)

---

## Original plan (for reference)

### 1. Define the matrix

Add `src/environments/matrix.ts`:

- Export `MATRIX` array: `[{ name: 'react18-vite5', react: '18', vite: '5' }, ...]`
- Start with 1 entry (current: React 18 + Vite 5), add more later

### 2. Generalize the generator

Update `src/environments/generator/index.ts`:

- Accept config: `generateSandbox(config: EnvConfig)` instead of hardcoded deps
- `EnvConfig`: `{ react?: '18'|'19', vite?: '5'|'6' }`
- Map config to package.json deps (e.g. `react: '19.0.0'` when `react: '19'`)

### 3. Per-project setup

Add `src/environments/setup.ts` (or `setup.matrix.ts`):

- Read `process.env.REF_TEST_ENV` → lookup in matrix → get config
- Call `bootstrap(config)` → get project root
- Expose project root: `globalThis.__REF_TEST_PROJECT__` or `process.env.REF_TEST_ROOT`

Tests already have `beforeAll(bootstrap)`. Either:
- **A)** Move bootstrap into setup file (run once per project before any test)
- **B)** Keep `beforeAll(bootstrap)` but pass config from env; setup only sets `REF_TEST_ENV`

Prefer **A** — setup runs first, tests just `getProject()` and use it. Simpler.

### 4. Vitest config with projects

Update `vitest.config.ts`:

- Import matrix
- `test.projects`: map each matrix entry to `{ name, extends: true, env: { REF_TEST_ENV }, setupFiles: ['src/environments/setup.ts'], include: ['src/tests/**/*.test.ts'] }`
- Root config: `environment: 'node'`, `testTimeout`, `setupFiles` (global if any)

### 5. Test changes

Update `core-system.test.ts`:

- Remove `beforeAll(bootstrap)` — setup does it
- Add `getProject()` helper (from lib) that reads `globalThis.__REF_TEST_PROJECT__`
- Use `getProject()` in tests instead of `project` from beforeAll

### 6. Cleanup / isolation

- Each project runs in its own worker → separate sandbox dirs
- Use `REF_TEST_SANDBOX_DIR` or similar: `.sandbox/react18-vite5`, `.sandbox/react19-vite6` so parallel runs don’t clash

### 7. (Later) Add matrix entries

When ready: add `react19-vite6` to matrix, wire generator for React 19 + Vite 6.

---

## File structure

| File | Role |
|------|------|
| `src/environments/matrix.ts` | Matrix: React 17/18/19 × Vite |
| `src/environments/configs/{name}/ui.config.ts` | Per-project ui.config (customize tokens, etc.) |
| `src/environments/setup.{name}.ts` | Per-project setup: bootstrap before tests |
| `src/environments/generator/index.ts` | generateSandbox(config) with React version mapping |
| `src/lib/project.ts` | `getProject()` reads bootstrapped project from setup |

---

## Running tests

If `ref sync` fails with "Virtual native addon not available", run first:

```bash
cd packages/reference-core && pnpm run build:native
```
