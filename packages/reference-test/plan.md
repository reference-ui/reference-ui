# reference-test Re-architecture Plan

> Align the test suite with the DESIGN_SYSTEMS.md vision and support multiple ui.config use cases without multiplying environments.

---

## The Problem

1. **Single config.** We have one `ui.config.ts` and one token set. Different design-system scenarios (`extends`, `layers`, `extendSystem`, etc.) need different configs. Adding separate configs gets weird.

2. **Single app, split entrypoints.** `main.tsx` vs `main.react17.tsx` is a brittle pattern. React version is already a matrix axis; we shouldn't need separate entry files.

3. **Environment vs use case.** The matrix (React × Bundler) defines **environments** — real-world combinations we test against. The design-system scenarios are **use cases** — different `ui.config` shapes. We should not spin up a separate environment per use case. Each environment should be able to run multiple use cases.

4. **Config changes during test.** To test different use cases within the same environment, we need to modify `ui.config.ts` (or equivalent) and have the CLI recompile. The CLI must react and recompile on the fly.

5. **Ready signal.** Tests must know when recompilation is complete. Currently there is no explicit "ready for tests" signal from `ref sync --watch`.

---

## The Pattern

### Environments folder

`src/environments/` is the structural source of truth. We define a **manifest** (strict file list) and **override layers** that compose per matrix entry:

```
src/environments/
  manifest.ts     # MANIFEST (file list) + composeSandbox(entry, dest)
  base/           # Main source – full file set, shared app shell
  react/
    17/           # Override main.tsx (ReactDOM.render)
    18/           # Empty – base uses createRoot (React 18+)
    19/           # Empty – base suffices
  bundlers/
    vite/
      5/          # Override vite.config.ts if needed (empty for now)
```

For each matrix entry, we compose: base → react/{version} → bundlers/{name}/{version}. Any layer can override any manifest file. The result is a sandbox with exactly the manifest files.

The matrix (React × Bundler) remains the environment axis. Each matrix entry gets a sandbox built via `composeSandbox(entry, sandboxDir)`.

### Use cases = different ui.config

Use cases are variations of `ui.config.ts` and related config (tokens, `extends`, `layers`, etc.). Examples from DESIGN_SYSTEMS.md:

- Minimal: `defineConfig({ name, include })` — no upstream
- Extends baseSystem: `defineConfig({ extends: [baseSystem] })`
- Layers: `defineConfig({ layers: [referenceTheme] })`
- Own system + Reference components

We do **not** create a separate environment/sandbox per use case. Instead, during a test, we:

1. Write the desired `ui.config.ts` (and any supporting files) into the sandbox
2. The CLI (`ref sync --watch`) picks up the change and recompiles
3. We wait for a **ready signal**
4. Assert

So: one environment (one sandbox), many use cases (config changes within that sandbox).

### CLI recompilation on config change

The CLI already watches files and reacts to changes. When `ui.config.ts` (or files it imports) changes:

- `watch:change` → `virtual:fs:change` → system re-runs
- Config is re-loaded (bootstrap is per sync run; in watch mode the system worker re-invokes the config load path when it handles the change)
- Full pipeline: virtual → system → gen → packager → packager-ts

We need to ensure:

1. **Config is in the watch set.** `ui.config.ts` must match `config.include` (or be explicitly watched). If the config lives at project root, it may need special handling.

2. **Config changes trigger full recompile.** The system worker must treat config/config-import changes as a full re-run, not a no-op.

### Ready signal

Tests need to know when "ref sync has finished this build." Options:

1. **File-based sentinel.** CLI writes a `.reference-ui/ready` file (or similar) when `packager:complete` (and optionally `packager-ts:complete`) fires. Tests poll for existence/timestamp.

2. **Event file.** CLI appends a line to a well-known file (e.g. `.reference-ui/build-events.jsonl`) on each `packager:complete`. Tests poll and read the latest.

3. **HTTP endpoint.** A small dev-only server that the CLI notifies when ready. Tests `fetch` until 200. Adds complexity.

4. **Stdout parsing.** CLI prints a known string (e.g. `[ref] ready`) on `packager:complete`. start-dev.ts captures stdout; tests would need to coordinate. Fragile.

**Recommended: file-based sentinel.** Simple, no new processes, easy to poll. CLI writes `.reference-ui/ready` with a timestamp or build id when packager completes. Tests poll `existsSync` + optional content check. Delete or overwrite on each build so "ready" means "latest build done."

The sentinel path should be configurable (e.g. `config.readyFile` or env `REF_READY_FILE`) so tests can point it at a known location in the sandbox.

---

## Implementation Outline

### Phase 1: Environments structure — DONE

1. `src/environments/base/` — full file set (main.tsx, App.tsx, index.html, vite.config.ts, ui.config.ts, tsconfig.json, tests/*)
2. `src/environments/react/17/main.tsx` — override for React 17 (ReactDOM.render)
3. `src/environments/react/18/`, `react/19/`, `bundlers/vite/5/` — placeholder dirs for future overrides
4. `src/environments/manifest.ts` — `MANIFEST` const + `composeSandbox(entry, destDir)`
5. `prepare.ts` — uses `composeSandbox` instead of `cp(app)`, hashes `ENVIRONMENTS_ROOT`

### Phase 2: Config as test input

1. Define use-case configs as data or templates in `src/lib/` or `src/environments/base/configs/`:
   - `minimal.config.ts`
   - `extends-base.config.ts`
   - etc.

2. Add test helpers: `writeUseCaseConfig(sandboxDir, useCaseName)` — writes the appropriate `ui.config.ts` (and any imported files) into the sandbox.

3. Ensure `ui.config.ts` (and its transitive imports) are under watch. If config lives at project root, add it to the watched set.

### Phase 3: CLI ready signal

1. Add `packager:complete` → write sentinel file in reference-core CLI.
2. Make path configurable via config or env.
3. In start-dev.ts or test setup: wait for sentinel before starting Vite (optional) or before tests run (required for use-case-switching tests).

### Phase 4: Use-case tests

1. Tests that:
   - Start with a base config
   - Run initial assertions
   - Call `writeUseCaseConfig(sandboxDir, 'extends-base')`
   - Poll for ready signal (sentinel updated)
   - Run assertions for the new config
   - Optionally switch again and re-assert

2. Ensure sync-watch and similar tests still pass; they already modify files and wait for visible changes. The ready signal is an optimization and a gate for config-switch tests.

---

## Open Questions

- **Config location.** Should `ui.config.ts` live in the sandbox root (as in real apps) or under `src/`? If root, the virtual layer and watch patterns need to include it.
- **Token registration.** Tokens today come from `lib/ref-config/`. With multiple use cases, some may not use our test tokens. Ensure register/tokens are only included when the use case expects them.
- **Parallel sandboxes.** With `REF_TEST_PARALLEL=1`, each matrix project runs in parallel. Config switching happens within a project run, so no new parallelism concerns. The sentinel path is per-sandbox.
- **Cold vs watch.** The ready signal matters most in watch mode. For cold `ref sync`, the process exits on completion; prepare.ts already awaits that. So the sentinel is primarily for the "dev server with ref sync --watch" scenario.

---

## Done when

1. ~~`src/environments/base/` with override layers (react/17, bundlers/vite/5)~~ ✓
2. Use-case configs can be written into the sandbox during a test.
3. CLI emits a ready signal (file sentinel) when packager completes in watch mode.
4. Tests can switch use cases, wait for ready, and assert — all within one environment run.
