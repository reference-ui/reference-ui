# TypeScript Declaration Generation Issue

## Problem Statement

When building TypeScript declarations (`.d.ts` files) for the `@reference-ui/system` package using `tsdown` (which uses `rolldown-plugin-dts`), we encountered errors where the declaration bundler couldn't emit portable type definitions for certain API exports.

### Error Example

```
[plugin rolldown-plugin-dts:generate]
RollupError: src/system/api/staticCss.ts(11,14): error TS4023: 
Exported variable 'staticCssCollector' has or is using name 'ExtendableStaticCssOptions' 
from external module "/Users/ryn/Developer/reference-ui/node_modules/.pnpm/@pandacss+types@1.8.2/node_modules/@pandacss/types/dist/config" 
but cannot be named.
```

### Root Cause

The issue occurs when:
1. We export fragment collectors that have generic types from `@pandacss/types`
2. These Panda types reference complex internal types (e.g., `ExtendableStaticCssOptions`, `ExtendableGlobalStyleObject`)
3. The declaration bundler (`rolldown-plugin-dts`) attempts to inline these types but encounters `.pnpm` path references
4. TypeScript's declaration emit requires that all exported types be "nameable" without non-portable paths

## What We Fixed

### 1. Dependency Placement (CRITICAL FIX)

**Before:**
```json
{
  "devDependencies": {
    "@pandacss/dev": "^1.8.1"
  }
}
```

**After:**
```json
{
  "dependencies": {
    "@pandacss/dev": "^1.8.1",
    "@pandacss/types": "^1.8.2"
  }
}
```

**Why:** The CLI uses Panda CSS at runtime for code generation, not just at dev time. This was incorrectly categorized.

### 2. API Files - Two Patterns

#### Pattern A: No Workaround Needed ✅

These files work cleanly without type casting:

- `tokens.ts` - uses `Config['theme']['tokens']`
- `keyframes.ts` - uses `Config['theme']['keyframes']`  
- `globalCss.ts` - uses `Config['globalCss']`
- `globalFontface.ts` - uses `Config['globalFontface']`

**Example (tokens.ts):**
```typescript
type TokenConfig = NonNullable<Config['theme']>['tokens']
type PandaConfig = Partial<Config>

export const tokensCollector = createFragmentCollector<TokenConfig, PandaConfig>({
  name: 'tokens',
  targetFunction: 'tokens',
  transform: tokenConfig => ({
    theme: { tokens: tokenConfig },
  }),
})

export const tokens = tokensCollector.collect
```

#### Pattern B: Type Casting Required ⚠️

These files need type widening workarounds:

- `utilities.ts` - uses `Config['utilities']['extend']`
- `staticCss.ts` - uses `Config['staticCss']`

**Example (utilities.ts):**
```typescript
type UtilityExtend = NonNullable<NonNullable<Config['utilities']>['extend']>
type PandaConfig = Partial<Config>

const collector = createFragmentCollector<UtilityExtend, PandaConfig>({
  name: 'utilities',
  targetFunction: 'utilities',
  transform: config => ({
    utilities: { extend: config },
  }),
})

// Type cast to portable Record for declaration emit
export const utilitiesCollector = collector as FragmentCollector<
  Record<string, unknown>,
  Record<string, unknown>
>

export const utilities = collector.collect as (config: Record<string, unknown>) => void
```

## Why Some APIs Need Workarounds

### Panda Type Structure Investigation

After investigation, we found:

1. **`Config['theme']['tokens']`** and **`Config['theme']['keyframes']`**
   - These resolve to simpler token definition types
   - No deep nested references to complex Panda internals
   - Declaration bundler can emit these cleanly

2. **`Config['globalCss']`** and **`Config['globalFontface']`**
   - Initially thought to need workarounds
   - After moving Panda to dependencies, these work without casting
   - Types are "simple enough" for the bundler

3. **`Config['utilities']['extend']`** and **`Config['staticCss']`**
   - Resolve to `UtilityConfig` and `ExtendableStaticCssOptions`
   - These reference deeply nested Panda internal types like:
     - `SystemStyleObject`
     - `PropertyConfig`
     - Multiple levels of conditional types
   - Declaration bundler cannot inline these without exposing `.pnpm` paths
   - **Require type casting to `Record<string, unknown>` for portable declarations**

## Trade-offs of Current Solution

### ✅ Pros
- Internal code maintains full Panda type safety during development
- TypeScript compilation works correctly (`tsc --noEmit`)
- Declaration bundler succeeds in generating portable `.d.ts` files
- Consumers never see Panda CSS (hidden behind generic types)
- All 55 tests pass

### ⚠️ Cons
- `utilities` and `staticCss` functions accept `Record<string, unknown>` instead of specific Panda types
- Consumers lose IntelliSense/autocomplete for these two APIs
- Must rely on JSDoc examples and Panda documentation
- Type safety for consumers is reduced (though runtime behavior is identical)

## Attempted Solutions That Didn't Work

### 1. Externalizing `@pandacss/types` in tsdown

**Tried:**
```typescript
'--external', '@pandacss/types'
```

**Result:** Failed. The bundler still tries to inline the type definitions, and the `.pnpm` path issue persists even when the package is externalized.

### 2. Using Explicit Type Annotations Instead of `as`

**Tried:**
```typescript
export const utilitiesCollector: FragmentCollector<Record<string, unknown>, Record<string, unknown>> = collector
```

**Result:** TypeScript compilation failed due to strict type incompatibility between the inferred collector type and the explicit annotation.

### 3. Removing All Workarounds After Dependency Fix

**Tried:** After moving `@pandacss/types` to dependencies, attempted to use clean pattern for all APIs.

**Result:** `utilities` and `staticCss` still failed declaration generation with the same `.pnpm` path errors.

## Future Considerations

### Potential Long-term Solutions

1. **Make `@pandacss/types` a Peer Dependency**
   - Force consumers to install Panda types
   - Could re-export proper types
   - **Blocker:** Violates constraint that consumers must never know about Panda

2. **Generate Custom Type Definitions**
   - Create hand-written `.d.ts` files that don't reference Panda
   - Manually maintain type definitions for `utilities` and `staticCss`
   - **Blocker:** High maintenance burden, prone to drift

3. **Use JSDoc Type Imports (Type-only imports)**
   - Potentially avoid bundling issues with type-only imports
   - **Status:** Needs investigation

4. **Wait for rolldown-plugin-dts Improvements**
   - Issue may be fixed in future versions of the bundler
   - Could revisit when upgrading `tsdown` or `rolldown-plugin-dts`

5. **Re-export Simplified Types**
   - Create simplified type definitions that mirror Panda's structure
   - Re-export from `@reference-ui/system`
   - **Blocker:** Still violates "no Panda exposure" constraint

### Questions to Investigate

1. Why do `Config['theme']['tokens']` and `Config['theme']['keyframes']` work but `Config['utilities']` doesn't?
   - **Answer:** Token types are simpler, don't have deep nested conditional types

2. Why did `globalCss` and `globalFontface` suddenly work without workarounds after dependency fix?
   - **Hypothesis:** With Panda as a dependency, simpler types can be resolved
   - **But:** More complex types like `UtilityConfig` still fail

3. Can we use TypeScript 5.x `isolatedDeclarations` to help?
   - **Status:** Needs investigation
   - May require explicit type annotations on all exports

## Testing

All tests pass with current solution:
- ✅ CLI tests: 4 files, 31 tests
- ✅ App tests: 8 files, 24 tests
- ✅ TypeScript declarations generated successfully for both `react` and `system` packages

## Related Files

- Declaration compilation: `src/packager/ts/compile/index.ts`
- Entry point: `src/entry/system.ts`
- Fragment collector: `src/lib/fragments/collector.ts`

## Status

**Current State:** Working with workarounds for `utilities` and `staticCss`.

**Action Items:**
- [ ] Investigate if newer versions of `tsdown`/`rolldown-plugin-dts` fix this
- [ ] Research `isolatedDeclarations` option
- [ ] Consider if consumer DX is acceptable with generic types
- [ ] Document the limitation in user-facing documentation
