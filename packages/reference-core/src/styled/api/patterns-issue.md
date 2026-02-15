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
