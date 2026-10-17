# Release go-list

Work top to bottom. Each box is one shippable step;
tick it when its check passes.

## 1. Binaries

- [ ] CI builds the native core for every target (linux x64/arm64,
      darwin x64/arm64, win32 x64), not just linux. darwin-arm64 and win32
      are stale today.
- [ ] WASM build of the Rust core ships beside the native ones (as Panda
      does), so `ref sync` runs in cloud sandboxes and WebContainers.
- [ ] Loader falls back to WASM when the platform binary is missing or fails
      to load.
- [ ] Smoke passes on each native target and on WASM alone.
- [ ] Windows: the staged-publish rename swap (`src/sync/commit.ts`) and the
      tasty per-file swap behave correctly. Known risks, unverified: a rename
      over a live file a bundler or editor holds open fails with EPERM/EBUSY,
      so the commit fails; the rollback renames can fail the same way and
      leave files stuck (their backups are kept); and `symlinkSync`
      (`src/sync/commit-journal.ts`, backing up a symlinked live file) needs
      Developer Mode or admin rights, so it throws EPERM without them.

## 2. Pipeline

- [ ] Fresh clone in CI runs every suite green. Gitignored fixtures were
      partly tracked on 2026-10-14; confirm styletrace sync-root,
      ATM-SITE-16/54/58 and NEO-DIAG-56/57.
- [ ] `docs.yml` artifact path fixed.
- [ ] npm-tarball fallback for unbuildable explicit targets.
- [ ] GitHub Actions and repo settings configured.
- [x] Matrix MCP model cache never invalidates: the build returns early when
      `model.json` exists, so a stale model survives any Atlas change. Key the
      cache on the Atlas build (or its inputs) so CI can't pass on old data.

## 3. Publish (in this order)

- [ ] `@reference-ui/rust`: publish with all 13 subpath exports; 0.0.42 has
      6 and lacks `./atomic`, `./namer`, `./system`, `./typegen`,
      `./diagnostics`, `./primitives` and `./contracts`, which Neo imports.
      Bump the version (0.0.42 is already on the registry).
- [ ] `@reference-ui/icons`: republish (0.0.43 ships broken declarations),
      bump lib's icons pin, and drop the lib smoke's `SIBLING_OWNED_PREFIXES`
      tolerance.
- [ ] Neo's public package: pick the published name (`@reference-ui/neo` is
      `private`, 0.0.0) and make every README's `defineConfig` /
      `extendSystem` import match.
- [ ] `@reference-ui/lib`.
- [x] Before publishing, reproduce whether the content-version stamps in
      `.reference-ui/{system,types}/package.json` match a recompute of their
      dirs (see neo `src/packager/content-version.ts`). On 2026-10-15 react's
      matched and system's and types' did not; suspects are stray files in
      those dirs (compile-request.json, evaluated-system.json,
      jsx-elements.json, a stale system.mjs). Fix before any version ships.
- [ ] After each publish: the packed-consumer type probe against the real
      registry (TS 7 and 5.9; bundler, node16, nodenext; `skipLibCheck` on
      and off) gives 0 errors on the positive file and exact errors on the
      deliberate one.

## 4. Launch

- [x] Out-of-range controlled values (non-blocking). The rule: a component
      given a value outside its range either clamps it, so render and ARIA
      agree, or warns in dev, naming component, prop, value and valid range;
      it never fails silently. Slider and Splitter comply. Four don't:
      NumberField renders `999` with `max={10}` verbatim; Calendar marks a
      disabled out-of-range day `aria-selected`; Listbox and Tree ignore an
      unmatched value or id without a word (mirror Tabs' warning).
- [x] Dev warnings may print in production. Lib's "not production" check reads
      `globalThis.process`; a browser bundle with no `process` shim may count
      as development, so Slider, Splitter, Tabs and the four new out-of-range
      warnings could reach real users' consoles. Neo's `isProductionBuild`
      (runtime `css()` misses and the new recipe missing-table warning) has the
      same `typeof process` gap. One shared helper, proven in a production build.
- [x] Listbox: an uncontrolled `selection="multiple"` Listbox with options
      never settles, because it made a new `[]` every render.
- [x] A user `ui.config` that imports the `@reference-ui/lib` barrel pays
      ~1.5s of config evaluation on every sync; only in-repo configs are
      guarded (neo `src/config/base-system-import.test.ts`). Document the
      `@reference-ui/lib/baseSystem` subpath, or warn when config eval is slow.
- [x] Atlas undercounts usage (non-blocking). Its JSX walker skips class
      bodies, optional-chain calls, `throw`, template literals and `new`
      arguments, so a component used only there (e.g. inside an
      `ErrorBoundary` class) is missing from component and primitive stats.
- [x] Repo hygiene: remove the working-process docs and the links that
      pointed at them before the repo goes public.
- [ ] Branding.
- [ ] Push `public-release` and open it up.
