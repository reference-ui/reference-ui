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

- **createPandaConfig**: Uses the panda partials from that single run, but routes them through the extensions API instead of implementing merge logic directly in Liquid.
- **Font pipeline**: Takes the collected font definitions from the same run; renders tokens, @font-face, recipe, pattern via Liquid; writes pattern fragment (e.g. microbundle) as today.
- **Pattern pipeline**: Takes the collected pattern extensions from the same run; merges with system patterns; produces pattern fragment for config.
- **extendPandaConfig / extendPattern**: Remain as **internal** implementation. They are not the scan target; they are the sinks that the public API (`tokens`, `font`, `extendPattern`) write to.
- **Extensions runtime**: Owns the actual merge/apply behavior (`deepMerge`, config accumulation, pattern registration) so templates stay focused on composition.

### 4. Public API = contract

- **User space**:
  ```ts
  import { tokens, font } from '@reference-ui/system'
  tokens({ ... })
  font({ ... })
  ```
- **We care about**: (1) Did they import from `@reference-ui/system`? (discovery) (2) What is the runtime output of `tokens`, `font`, etc.? (collection in one run).
- **We do not care about** exposing or scanning for `extendPandaConfig`. It stays an internal detail.

### 5. Extensions layer closes the loop

- **Problem**: Injecting `deepMerge(...)` directly into the generated Panda template is messy and pushes too much behavior into Liquid.
- **Direction**: Bundle an **extensions API** in normal TS code and run that in the config execution context.
- **Shape**:
  - The extensions API owns a single Panda-config accumulator for the current execution.
  - Helpers like `extendTokens(...)`, `extendKeyframes(...)`, and `extendPattern(...)` call `deepMerge` internally and write into that accumulator.
  - Liquid just wires collector output into those helpers and controls execution order.
- **Result**: The config template becomes orchestration code, while config semantics live in code we can bundle, test, and evolve cleanly.

---

## Checkpoint

### What is done

1. **Discovery is now import-based**: `scanForFragments(...)` supports `importFrom`, and the Panda config flow now discovers fragment files by `@reference-ui/system` / `@reference-ui/cli/config` instead of scanning for `tokens(...)`.
2. **`createPandaConfig(...)` is simpler**: It no longer bundles files or knows collector internals. It consumes prepared `CollectorBundles`, injects `collectorFragments`, and reads named fragment values from that bundle.
3. **The fragments layer owns runtime setup**: Collector initialisation, runtime fragment functions, and generated getter code all live in the fragments layer instead of being redefined inside Panda config generation.
4. **Missing fragment calls are normal**: If a file imports the system API but does not call `tokens()` or `keyframes()`, the generated Panda config still works and treats those as empty fragment lists.
5. **Multiple collectors are already supported by the runtime bundle**: The current Panda config flow now prepares both `tokens()` and `keyframes()` in the same collector bundle.
6. **First multi-collector API step is in place**: `tokens()` and `keyframes()` both exist in the new architecture and both feed Panda config correctly.

### Verified

1. **Focused CLI fragments/API tests pass**:
   - `src/lib/fragments/tests/fragments.unit.test.ts`
   - `src/lib/fragments/tests/e2e.test.ts`
   - `src/system/api/tokens.test.ts`
   - `src/system/api/keyframes.test.ts`
2. **Full system verification passes**: `pnpm test:system`
3. **Reference app still works with the new flow**: system config generation, Panda codegen, packaging, and app tests all pass in the full system run.

### What remains

1. **Add more public fragment APIs**: `font()`, `globalCss()`, `recipe()`, `slotRecipe()`, `textStyle()`, `layerStyle()`, etc. should follow the same shape as `tokens()` / `keyframes()`.
2. **Use one evaluation for all downstream consumers**: The runtime bundle already supports multiple collectors, but Panda/font/pattern consumers still need to be wired around the same single run rather than separate subsystem flows.
3. **Add non-token import-discovery coverage**: We now cover `tokens()` and `keyframes()`. Add fixtures/tests for files that import the system API but only call other public fragment functions, especially `font()`.
4. **Keep internal sinks internal**: `extendPandaConfig` / similar implementation details should stay out of discovery and remain just downstream sinks for the public API.
5. **Bundle the extensions API during the styled build**: `packages/reference-cli/src/build/styled.ts` should bundle the extensions runtime into local CLI output at `src/system/styled/extensions`.
6. **Mirror the same extensions bundle during `ref sync`**: Copy that bundled runtime into the user's `outDir/styled/extensions` so the generated config and the internal CLI build share the same behavior.
7. **Strip merge logic out of Liquid**: Once the extensions runtime is bundled, `panda.liquid` should stop defining `deepMerge` inline and instead call the bundled helpers.

### Tonight's conclusion

This work is in a good stopping place. The fragments architecture now matches the intended direction much better:

- one discovery rule based on public API usage
- a cleaner `createPandaConfig(...)` boundary
- prepared multi-collector fragment bundles
- verified support for both `tokens()` and `keyframes()`
- a clear next step for moving config semantics into a bundled extensions API

The next session should mostly be about extending the same pattern to the remaining public system APIs, bundling the extensions runtime, and making Liquid a thin routing layer instead of revisiting the core fragments mechanics.

---

## Summary

| Today | Target |
|-------|--------|
| Scan by function name (tokens, extendFont, extendPattern) | Scan by import from `@reference-ui/system` |
| Multiple scans and runs per "kind" (config, font, patterns) | One fragment file list, one run, all collectors |
| extendPandaConfig / extendPattern as scan targets | Public API (tokens, font, extendPattern) as contract; extendPandaConfig etc. are internal sinks |
| createPandaConfig + font + patterns each drive their own collection | createPandaConfig (and font/pattern pipelines) consume the result of a single collection run |
| `deepMerge` / apply logic lives in generated template code | Bundled extensions API owns merge/apply behavior in normal TS |
| Internal CLI build and user `ref sync` can drift | Build extensions once to `src/system/styled/extensions`, then copy to `outDir/styled/extensions` |

This keeps the fragment model simple: **one discovery rule, one evaluation, then route the collected data into a bundled extensions API that cleanly produces Panda config, font rendering, and pattern merging.**
