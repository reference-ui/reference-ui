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

### Root Cause: Package Manager or TypeScript?

**Neither alone. It's a combination of three things:**

1. **rolldown-plugin-dts (declaration bundler)** – Cannot inline certain complex Panda types. When it hits types with mapped types over literal unions (`LiteralUnion<CssProperty>`), generic function types (`PropertyTransform`), or nested conditionals, it does not inline them and instead emits a reference to the source module.

2. **TypeScript (TS4023)** – Correctly rejects declarations that reference non-portable paths. All emitted type references must be resolvable for consumers. TypeScript is behaving as designed.

3. **pnpm (package manager)** – Symlinks in `.pnpm` create paths like `node_modules/.pnpm/@pandacss+types@1.8.2/node_modules/@pandacss/types/dist/config`. When rolldown-plugin-dts emits a path reference, that path is often non-portable under pnpm.

**Vendoring test:** Copying Panda types into `src/vendor/` and using path aliases still failed with:
```
...from external module ".../packages/reference-cli/src/vendor/@pandacss/types/config" but cannot be named.
```
So the limitation is in the bundler’s ability to inline these types; pnpm just makes the failure more obvious.

**Summary:** The primary limitation is in **rolldown-plugin-dts**, which cannot inline complex Panda types. **TypeScript** correctly rejects the resulting non-portable paths. **pnpm** is an amplifier: its `.pnpm` paths are clearly non-portable; npm/yarn might have worked but were not tested.

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
   - Resolve to `ExtendableUtilityConfig` and `ExtendableStaticCssOptions`
   - These use structures rolldown-plugin-dts cannot inline:
     - Mapped types over literal unions: `LiteralUnion<CssProperty>`
     - Generic function types: `PropertyTransform`, `TransformArgs<T>`
     - Nested conditional types and index signatures
   - The bundler emits a path reference instead of inlining; TypeScript rejects it as non-portable
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
   - **Tested:** Yes. Requires `declaration: true` + explicit type annotations on all exports.
   - **Result:** 100+ errors across the codebase. Massive refactor for uncertain benefit.

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

**Root Cause:** rolldown-plugin-dts cannot inline complex Panda types (mapped types, generic functions, nested conditionals). It emits path references; TypeScript rejects non-portable paths. pnpm's `.pnpm` symlinks make those paths obviously non-portable.

**Attempted Solutions:**
- ✅ Upgraded tsdown from v0.20.1 → v0.21.0 (latest, released March 5, 2026)
- ✅ Migrated to new v0.21.0 CLI options (`--deps.neverBundle`, `--no-deps.onlyAllowBundle`)
- ❌ Tried `--deps.alwaysBundle` for Panda packages (still failed)
- ❌ Tried `.npmrc` with `node-linker=hoisted` in package (doesn't work in pnpm workspaces)
- ❌ Vendored Panda types locally (path reference still rejected)
- ❌ Tested `isolatedDeclarations` (requires 100+ explicit annotations)

**Why This Only Affects Two APIs:**
- `tokens`, `keyframes`, `globalCss`, `globalFontface` use simple interfaces → bundler can inline them
- `utilities` and `staticCss` use `ExtendableUtilityConfig` / `ExtendableStaticCssOptions` with mapped types and generic functions → bundler cannot inline, emits path reference, TypeScript rejects it

**Action Items:**
- [x] Upgrade tsdown to v0.21.0 and migrate CLI options
- [x] Keep `Record<string, unknown>` type casting for `utilities` and `staticCss`
- [x] Add `tsx` as devDependency in reference-cli
- [ ] Document the limitation in user-facing documentation
