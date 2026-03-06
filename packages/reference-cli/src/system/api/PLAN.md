# Plan: Type-Easy Fragment API (avoid TS4023 workarounds)

## Problem

Declaration bundlers (tsup/tsdown) cannot emit portable types for `staticCss` and `utilities` when we export `collector.collect` directly. The collector object carries `FragmentCollector<StaticCssConfig, PandaConfig>` — complex types that flow through to the exported function. When the bundler tries to emit the function's param type (`ExtendableStaticCssOptions`, `UtilityConfig`), it fails with TS4023.

---

## Big Idea: extendPandaConfig as Centerpiece

**extendPandaConfig(partial: Partial<Config>)** is a great signature. It's the single base API. Everything else is a typed transform that calls it.

```
tokens(cfg)      → extendPandaConfig({ theme: { tokens: cfg } })
staticCss(cfg)   → extendPandaConfig({ staticCss: cfg })
utilities(cfg)   → extendPandaConfig({ utilities: { extend: cfg } })
keyframes(cfg)   → extendPandaConfig({ theme: { keyframes: cfg } })
globalCss(cfg)   → extendPandaConfig({ globalCss: cfg })
...
```

When we bundle user files, they import `tokens`, `staticCss`, etc. from `@reference-ui/system`. Those run and eventually call `extendPandaConfig`. The transform is at the call site — each API is a thin, typed wrapper.

**Benefits:**

- One collector, one `toScript`, one `toGetter` — simpler Liquid/config generation
- `extendPandaConfig` has a clean, declaration-friendly signature: `Partial<Config>`
- API layer = typed "transform functions" that may emit better than collector objects
- Aligns with reference-core, which already uses this pattern (extendStaticCss → extendPandaConfig)

---

## Architecture: Fragments with extendPandaConfig at the Base

### Current (multiple collectors)

```
runConfig → collectors: [tokensCollector, staticCssCollector, utilitiesCollector, ...]
createPandaConfig → N × toScript(), N × toGetter()
Liquid template → collectorSetups (6 slots), collectorGetters (6)
Bundles run → tokens() pushes to __refTokensCollector, staticCss() to __refStaticCssCollector, ...
```

### Target (single collector)

```
runConfig → one pandaConfigCollector (or equivalent)
createPandaConfig → 1 × toScript(), 1 × toGetter()
Liquid template → one slot (COLLECTOR_KEY), one getter
Bundles run → tokens() → extendPandaConfig(partial), staticCss() → extendPandaConfig(partial), ...
All partials collected in one array, deepMerged at the end
```

### API layer = transform wrappers

```ts
// src/system/api/staticCss.ts
export function staticCss(config: NonNullable<Config['staticCss']>): void {
  extendPandaConfig({ staticCss: config })
}

// src/system/api/utilities.ts
export function utilities(
  extend: NonNullable<NonNullable<Config['utilities']>['extend']>
): void {
  extendPandaConfig({ utilities: { extend } })
}

// src/system/api/tokens.ts
export function tokens(tokensConfig: NonNullable<Config['theme']>['tokens']): void {
  extendPandaConfig({ theme: { tokens: tokensConfig } })
}
```

No `createFragmentCollector` per API. No `staticCssCollector`, `utilitiesCollector` exports. Just functions.

---

## Fragments System: What Changes

### Option A: Minimal — one panda collector, keep createFragmentCollector for other uses

- Add `extendPandaConfig` to reference-cli (or import from core; ensure COLLECTOR_KEY matches)
- Add `createPandaConfigCollector()` — returns object with `init`, `toScript`, `toGetter` for the single slot
- runConfig uses that one collector
- createPandaConfig (Liquid) gets one setup, one getter
- API files become plain transform functions as above

### Option B: Generalize — "fragment API = extendPandaConfig + transform"

- `defineConfigFragment<T>(name, targetFunction, toPartial)` — registers for scanning and returns a function that calls extendPandaConfig
- Internally: one collector, one extendPandaConfig
- `defineConfigFragment('staticCss', 'staticCss', cfg => ({ staticCss: cfg }))` → returns the typed function to export
- Centralizes: scan names, transform shape, single collector

### Option C: Full alignment with reference-core

- reference-cli's system API could re-export from reference-core's styled/api (extendTokens → tokens, extendStaticCss → staticCss, etc.) if the module graph allows
- Or mirror the implementations: both packages have the same pattern, extendPandaConfig lives in one place (core or CLI) and is imported where needed

---

## What Stays

- **Fragment scanning** — still looks for `tokens(`, `staticCss(`, `utilities(`, etc. in user code
- **bundleFragments** — bundles user files with @reference-ui/system alias; when bundle runs, our typed functions execute
- **Liquid template** — simplified to one collector setup and one getter
- **system.ts** — exports `tokens`, `staticCss`, `utilities`, etc. (now transform functions, not collector.collect)

## What Goes Away / Simplifies

- **Multiple FragmentCollectors** for system API — no tokensCollector, staticCssCollector, etc.
- **createPandaConfig** receiving an array of collectors — just one
- **Per-API transform in collector** — transform moves to the wrapper function

---

## Validation

1. Implement extendPandaConfig as centerpiece (one collector, transform wrappers)
2. Simplify createPandaConfig + Liquid to one slot
3. Run `ref sync`, confirm config generation works
4. Run packager-ts — do typed wrappers (e.g. `function staticCss(config: X): void`) emit without TS4023?
5. If yes: no more Record casts, full IntelliSense. If no: may still need casts on the two problematic APIs.

---

## Files to Touch (when implementing)

| Area              | Files                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| extendPandaConfig | Add to CLI or wire from core; ensure COLLECTOR_KEY for sync flow                                           |
| runConfig         | Use single panda collector instead of DEFAULT_PANDA_COLLECTORS                                             |
| createPandaConfig | Accept one collector (or derive from extendPandaConfig)                                                    |
| Liquid template   | One collectorSetup, one collectorGetter                                                                    |
| API layer         | tokens.ts, staticCss.ts, utilities.ts, keyframes.ts, globalCss.ts, globalFontface.ts → transform functions |
| system entry      | Unchanged export list                                                                                      |
| Fragments lib     | Optional: add defineConfigFragment or createPandaConfigCollector                                           |

---

## Previous approach (typed wrapper only)

The earlier plan was to keep the multi-collector setup and just wrap `collector.collect` in a typed function. That might still help for TS4023. This new plan goes further: **unify around extendPandaConfig** so the architecture is simpler and the API layer is naturally "transform functions" that call one base.
