# Fragments: Refined Plan

## The insight

**Collectors should align with the public API, not with implementation.** We should discover "fragment" files by *usage of our system* (`@reference-ui/system`), then run those files **once** and capture everything the user asked for via `tokens()`, `font()`, `extendPattern()`, etc. What we do with that data (extendPandaConfig, Liquid, microbundles) is a downstream concern.

---

## Current pain

- **Multiple scans, multiple runs**: runConfig scans for `tokens`; font scans for `extendFont`/`font`; patterns scans for `extendPattern`. The same user file can be bundled and executed several times with different collectors.
- **Scan target is wrong**: We scan for internal/implementation names (`tokens` only for panda, `extendFont`/`font` for fonts, `extendPattern` for patterns). The single source of truth should be: "this file participates in the design system" → presence of `@reference-ui/system` (or equivalent).
- **extendPandaConfig as collector**: Panda config is the main fragment we care about, but we shouldn’t *scan* for extendPandaConfig. We should scan for *our API*, then let extendPandaConfig be the internal sink for tokens/keyframes/recipe/etc.

---

## Target architecture

### 1. Single fragment discovery

- **Signal**: A file is a "fragment" if it imports from `@reference-ui/system` (or a dedicated system entry we use for config/fragments).
- **Scanner**: Either extend `scanForFragments` or add a mode (e.g. `scanByImport: '@reference-ui/system'`) so we get one list of fragment files from user space. No per-collector function names for discovery.
- **Result**: One set of fragment file paths. No "panda fragments" vs "font fragments" vs "pattern fragments" at scan time — just "files that use the system."

### 2. Single evaluation (one run, all collectors)

- **One execution**: Bundle the fragment files (with alias `@reference-ui/system` → CLI system entry). Run the bundle **once** with all collectors initialised:
  - Panda config collector (for tokens, keyframes, recipe, globalCss, etc.)
  - Font collector (for `font()`)
  - Pattern collector (for `extendPattern()`)
- **API in the bundle**: The injected/generated code (or our system entry) exposes the public API; each call pushes to the right collector:
  - `tokens(...)` → extendPandaConfig({ theme: { tokens } })
  - `font(...)` → extendFont(...)
  - `extendPattern(...)` → pattern collector
  - etc.
- **Result**: After one run we have: panda partials, font definitions, pattern extensions. No re-scanning or re-running the same files for font vs config vs patterns.

### 3. Downstream: consume collected data

- **createPandaConfig**: Uses the panda partials from that single run (plus internal + pre-rendered font/pattern fragments as today if needed).
- **Font pipeline**: Takes the collected font definitions from the same run; renders tokens, @font-face, recipe, pattern via Liquid; writes pattern fragment (e.g. microbundle) as today.
- **Pattern pipeline**: Takes the collected pattern extensions from the same run; merges with system patterns; produces pattern fragment for config.
- **extendPandaConfig / extendPattern**: Remain as **internal** implementation. They are not the scan target; they are the sinks that the public API (`tokens`, `font`, `extendPattern`) write to.

### 4. Public API = contract

- **User space**:
  ```ts
  import { tokens, font } from '@reference-ui/system'
  tokens({ ... })
  font({ ... })
  ```
- **We care about**: (1) Did they import from `@reference-ui/system`? (discovery) (2) What is the runtime output of `tokens`, `font`, etc.? (collection in one run).
- **We do not care about** exposing or scanning for `extendPandaConfig`. It stays an internal detail.

---

## Implementation plan

### Phase A: Discovery by import

1. **Scanner**: Add import-based discovery (e.g. `scanForFragments({ include, importFrom: '@reference-ui/system', cwd })` or a dedicated `scanFragmentFilesByImport()`). Detect files that contain an import from the given module (string/regex for `from '@reference-ui/system'` or `from "@reference-ui/system"`).
2. **runConfig**: Switch to import-based scan for user fragment files instead of `functionNames: ['tokens']`. Keep `config.include` for globs.
3. **Tests**: Add fixtures that only call `font()` (no `tokens`) and ensure they are discovered and their output is used (panda still gets internal + font/pattern fragments; font pipeline gets font defs).

### Phase B: Single run with multiple collectors

1. **Runner**: Extend the fragment runner so we can pass **multiple collectors** and run the bundle once, initialising all of them before execution and gathering all results after. (Today `collectFragments` takes a single collector; we need "run this bundle, feed these N collectors.")
2. **runConfig**:
   - Get fragment files (import-based).
   - Run **one** bundle execution with panda + font + pattern collectors.
   - From that run: panda partials → createPandaConfig; font defs → getFontFragmentsForConfig (or inline font render); pattern extensions → getPatternFragmentsForConfig (or merge and produce pattern fragment).
3. **Font/pattern "collect"**: Remove separate `scanForFragments` + `collectFragments` for font and user patterns. They become consumers of the single-run result (font collector output, pattern collector output). System patterns (internal) can stay a separate path if they don’t live in user fragment files.

### Phase C: Clean up and document

1. **API surface**: Document that fragment discovery is "import from @reference-ui/system"; collection is "one execution, all API calls recorded."
2. **extendPandaConfig**: Keep as internal; ensure liquid/generated config still only exposes tokens, keyframes, recipe, etc., not extendPandaConfig to the bundle (or expose it only as the internal sink).
3. **Optional**: Deprecate or remove `targetFunction` from the panda collector for *scanning* (it can still exist for debugging or backward compatibility). Discovery is import-based; collection is multi-collector single-run.

---

## Summary

| Today | Target |
|-------|--------|
| Scan by function name (tokens, extendFont, extendPattern) | Scan by import from `@reference-ui/system` |
| Multiple scans and runs per "kind" (config, font, patterns) | One fragment file list, one run, all collectors |
| extendPandaConfig / extendPattern as scan targets | Public API (tokens, font, extendPattern) as contract; extendPandaConfig etc. are internal sinks |
| createPandaConfig + font + patterns each drive their own collection | createPandaConfig (and font/pattern pipelines) consume the result of a single collection run |

This keeps the fragment model simple: **one discovery rule, one evaluation, then route the collected data into Panda config, font rendering, and pattern merging.**
