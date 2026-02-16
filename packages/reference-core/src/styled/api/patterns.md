# Panda Pattern Transform Closure Issue

## The Problem

Panda CSS has a quirk in how it generates runtime pattern files: **external constants referenced in `transform()` functions are not captured in the generated code**.

### What Happens

When you define a pattern like this:

```ts
// patterns.ts
const FONT_PRESETS = {
  sans: { fontFamily: 'sans', letterSpacing: '-0.01em', fontWeight: '400' },
  serif: { fontFamily: 'serif', letterSpacing: 'normal', fontWeight: '373' },
  mono: { fontFamily: 'mono', letterSpacing: '-0.04em', fontWeight: '393' },
}

patterns({
  box: {
    transform(props) {
      const fontStyles = font ? FONT_PRESETS[font] || {} : {}
      // ... rest of transform
    }
  }
})
```

**The bundled `panda.config.ts` correctly includes `FONT_PRESETS`** thanks to esbuild bundling the entire file with its dependencies.

**BUT** when Panda generates the runtime files (e.g., `src/system/patterns/box.js`), it only extracts the `transform()` function body. The external `FONT_PRESETS` constant is not included, resulting in a runtime error: `FONT_PRESETS is not defined`.

### Why This Happens

Our mini-compiler (in `createPandaConfig.ts`) works perfectly:
1. ✅ Scans for files calling `patterns()`
2. ✅ Bundles them with esbuild
3. ✅ Properly inlines all dependencies in `panda.config.ts`

But Panda's codegen is separate:
1. Panda reads the bundled config
2. Extracts pattern definitions
3. **Only serializes the `transform` function itself** - no closure variables
4. Generates runtime pattern files without external constants

This is a limitation in how Panda serializes pattern transform functions for runtime code generation.

## The Solution

**Define constants inside the transform function scope:**

```ts
patterns({
  box: {
    transform(props) {
      // Define constants inside the function so Panda includes them
      const FONT_PRESETS = {
        sans: { fontFamily: 'sans', letterSpacing: '-0.01em', fontWeight: '400' },
        serif: { fontFamily: 'serif', letterSpacing: 'normal', fontWeight: '373' },
        mono: { fontFamily: 'mono', letterSpacing: '-0.04em', fontWeight: '393' },
      }
      const fontStyles = font ? FONT_PRESETS[font] || {} : {}
      // ... rest of transform
    }
  }
})
```

This works because Panda serializes everything inside the `transform()` function body when generating runtime files.

## Trade-offs

### ❌ What Doesn't Work
- External constants (get lost during codegen)
- Shared utilities defined outside transform
- Imported helper functions
- Module-level variables

### ✅ What Works
- Constants defined inside transform
- Inline helper functions within transform
- Direct prop manipulation
- Inline conditional logic

## Potential Engineering Solutions

### Option 1: Enhanced Pattern Transform Serialization
Modify how Panda serializes pattern transforms to capture closure variables. This would require changes to Panda's codegen.

### Option 2: Pre-processing Layer
Add a preprocessing step that automatically inlines external constants into transform functions before Panda processes them.

### Option 3: Pattern Macro System
Create a macro/template system that expands external references at build time.

### Option 4: Document and Accept
Accept the limitation and document that pattern transforms must be self-contained.

## Related Files

- `src/styled/api/patterns.ts` - Pattern registration API
- `src/styled/patterns.ts` - Pattern definitions (affected by this issue)
- `src/cli/panda/config/createPandaConfig.ts` - Our mini-compiler (works correctly)
- `src/cli/eval/registry.ts` - Function registry (includes `patterns`)
- `src/system/patterns/*.js` - Generated pattern runtime files (where issue manifests)

## Notes

This is not a bug in our eval/bundler system - that works perfectly. It's a limitation in Panda's pattern codegen that we discovered when trying to extract constants for better code organization.

---

## Learnings (from failed attempt: IIFE + closure inlining)

We tried to allow module-level constants (e.g. `FONT_PRESETS`) by:

1. **Pattern IIFE** – Bundling pattern files into a single IIFE (`panda-patterns.iife.js`), running it, capturing `globalThis.PandaPatternsExtend` and `globalThis.__PATTERN_CLOSURE__`.
2. **Closure inlining** – Parsing each transform’s `toString()`, prepending `const FONT_PRESETS = ...` into the function body, and creating a new function so Panda’s codegen would see the constant inside the transform.
3. **Inlined fragment** – Writing a `.cjs` fragment with the inlined transforms and feeding that into the main config bundle instead of the raw pattern source files.
4. **Barrel change** – Removing `createPandaConfig` from the panda-config barrel so config files didn’t pull `createRequire(import.meta.url)` into the bundled `panda.config.ts` (Panda runs it in CJS and `import.meta` is empty).
5. **generate-config command** – Adding a CLI step to regenerate `panda.config.ts` before `panda codegen` in the build.

**Why it was unstable / overcomplicated:**

- **Body extraction** – Transform functions can be `function (props) { }` or `(props) => { }` after bundling; extracting the body reliably (nested braces, minification) is fragile and led to `SyntaxError: Unexpected token '{'` with `new Function('props', inlinedBody)`.
- **Two systems** – Both “collect then inline” and “run IIFE then rewrite” added a lot of moving parts (pattern entry template, run IIFE in Node, merge + inline, write fragment, main config excludes pattern files and imports fragment). Hard to reason about and easy to break.
- **Barrel / build order** – Config generation and build order became tied to the new flow; any consumer of the panda-config barrel or the build script had to be aware of the new steps.

**Takeaway:** Keep the contract simple. `extendPandaConfig` works when everything needed is inside the transform. Any solution that keeps that contract and moves complexity “outside” is preferable.

---

## Proposed design: createPandaPattern as a layer outside extendPandaConfig

**Principle:** `extendPandaConfig` stays the single source of truth for “what gets merged into the Panda config.” It does not need to know about IIFEs, bundling, or closure capture. A separate system handles “turn pattern files into self-contained config” and then feeds the result into `extendPandaConfig`.

### How it would work

1. **Detect createPandaPattern at eval time (like extendPandaConfig)**  
   - During the same eval/scan pass that finds files calling `extendPandaConfig` / `tokens` / `patterns`, we also detect calls to **createPandaPattern** (or a dedicated pattern-registration function).  
   - We do **not** immediately call `extendPandaConfig`. We only record: “this file called createPandaPattern” (and optionally the call site or a handle to the file).

2. **Collect calls, then microBundle each as an IIFE**  
   - After the scan, we have a list of files (or call sites) that registered patterns.  
   - For each of those, we **microBundle** that file (and its dependencies) into an **IIFE**. The IIFE’s job is to run the file so that it calls createPandaPattern again, but this time inside the bundled scope where all closure (e.g. `FONT_PRESETS`) is inlined.  
   - So: one IIFE per file (or one combined IIFE) that, when run, produces the same pattern config object but with transforms that already close over inlined constants.

3. **Store IIFEs in a global register (in memory)**  
   - We don’t need to write the IIFE to disk for Panda. We can keep the **IIFE source string** (or the **result of running it**) in a global register in JS memory.  
   - That register is the “collected pattern config” that we will hand to `extendPandaConfig`.

4. **Call extendPandaConfig with the collected result**  
   - Once we have the merged, self-contained pattern config (from running the IIFE(s) and merging their return values), we call **extendPandaConfig(merged)**.  
   - From `extendPandaConfig`’s point of view, it’s just another call that pushes a partial config. It doesn’t know about createPandaPattern, IIFEs, or microBundle. The config it receives already has transforms that are self-contained (closures inlined by the bundle).

### Summary

| Layer | Responsibility |
|-------|----------------|
| **createPandaPattern (new)** | Runs during eval; collects which files call it; microBundles those files as IIFEs; runs IIFEs and stores results in a global register; then calls extendPandaConfig with the merged, self-contained config. |
| **extendPandaConfig (unchanged)** | Receives partial configs (including the one from createPandaPattern) and pushes them to the collector. No awareness of IIFEs or pattern bundling. |

So: **createPandaPattern** is a wrapper that turns “files that call createPandaPattern with module-level constants” into “one merged config with inlined closures,” then feeds that into the existing **extendPandaConfig** pipeline. The system stays stable because extendPandaConfig’s contract (“include all information in the transform or in the partial you pass”) is satisfied by the time we call it.
