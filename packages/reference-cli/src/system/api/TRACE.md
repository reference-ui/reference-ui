# Trace: System API Type Declaration Generation

## Goal

Build proper TypeScript declarations (`.d.ts` files) for the `@reference-ui/system` package that consumers can use with full type safety.

The system package exports fragment collection APIs (`tokens`, `globalCss`, `utilities`, etc.) that allow users to extend their design system configuration. These APIs need:

1. **Runtime functionality** - Collect configuration fragments at build time
2. **Type definitions** - Provide IntelliSense and type checking for consumers
3. **Portability** - Work across different environments without exposing internal implementation details

## The Challenge

We're building types for APIs that internally use Panda CSS types, but:
- Consumers must **never** see or interact with Panda CSS directly
- Type definitions must be **portable** (no absolute paths, no `.pnpm` references)
- APIs must work **at build time** (not runtime) in the user's codebase

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ User's App (e.g., reference-app)                            │
│                                                              │
│  src/system/tokens.ts:                                      │
│    import { tokens } from '@reference-ui/system'           │
│    tokens({ colors: { ... } })                             │
│                                                              │
│  ↓ (at build time, CLI packages this)                      │
│                                                              │
│  .reference-ui/                                             │
│    └── system/                                              │
│        ├── system.mjs        ← bundled code                │
│        └── system.d.mts      ← TYPE DECLARATIONS WE BUILD │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CLI Package (reference-cli)                                 │
│                                                              │
│  src/system/api/                                            │
│    ├── tokens.ts       ← API implementations               │
│    ├── globalCss.ts    ← (use Panda types internally)     │
│    └── utilities.ts                                         │
│                                                              │
│  src/entry/system.ts   ← Entry point (exports all APIs)    │
│                                                              │
│  ↓ (packager-ts processes)                                 │
│                                                              │
│  Generates: system.d.mts for user's app                    │
└─────────────────────────────────────────────────────────────┘
```

## Build Flow

```
1. User runs: ref dev (or tests execute)

2. Packager-TS worker starts
   └─> For @reference-ui/system package:
       installPackageTs(cliDir, cliDirForBuild, targetDir, pkg)

3. Compile declarations:
   compileDeclarations(
     cliDirForBuild,
     "src/entry/system.ts",        ← Entry point
     ".reference-ui/system/system.d.mts"  ← Output
   )

4. Spawns: npx tsdown src/entry/system.ts --dts --format esm ...
   - Working directory: packages/reference-cli
   - Uses: rolldown-plugin-dts to bundle type declarations
   - Externalizes: react, react-dom, @pandacss/types

5. Success: Writes .reference-ui/system/system.d.mts
   - This file is what consumers import from '@reference-ui/system'
   - Must be portable (no absolute paths, no internal references)
```

## The Problem

**When building declarations, some APIs fail with TS4023 error:**

```
[plugin rolldown-plugin-dts:generate]
RollupError: src/system/api/staticCss.ts(11,14): error TS4023: 
Exported variable 'staticCssCollector' has or is using name 'ExtendableStaticCssOptions' 
from external module ".../node_modules/.pnpm/@pandacss+types@1.8.2/node_modules/@pandacss/types/dist/config" 
but cannot be named.
```

### Failing Code Pattern

**staticCss.ts** (clean pattern that fails):

```ts
import type { Config } from '@pandacss/dev'

type StaticCssConfig = NonNullable<Config['staticCss']>  
// ↑ Resolves to: ExtendableStaticCssOptions (internal Panda type)

export const staticCssCollector = createFragmentCollector<StaticCssConfig, ...>({ ... })
// ↑ Declaration bundler must emit this type

export const staticCss = staticCssCollector.collect
// ↑ Function signature must be emitted
```

**What happens:**
- TypeScript resolves `Config['staticCss']` → `ExtendableStaticCssOptions`
- This type lives in `@pandacss/types/dist/config.d.ts`
- The declaration bundler tries to emit the collector's type
- It needs to reference `ExtendableStaticCssOptions` 
- **Problem:** The reference path contains `.pnpm` (non-portable)
- TypeScript rejects the declaration: "cannot be named"

## Root Cause Analysis

### Why `.pnpm` Paths Are Non-Portable

When pnpm installs `@pandacss/types`, the actual files live at:
```
node_modules/.pnpm/@pandacss+types@1.8.2/node_modules/@pandacss/types/dist/config.d.ts
```

If the declaration bundler emits a reference to this path:
- It's an **absolute path** specific to this machine
- Contains **`.pnpm`** which is pnpm's internal structure
- Won't work when the package is published/consumed elsewhere
- TypeScript TS4023 error: "not portable"

### The Panda Type That Fails

**Config['staticCss']** resolves to **ExtendableStaticCssOptions**.

From `@pandacss/types/dist/config.d.ts`:

```ts
// Line 95-97: NOT EXPORTED (private interface)
interface ExtendableStaticCssOptions extends StaticCssOptions {
  extend?: StaticCssOptions | undefined
}

// Line 163-184: Exported interface
export interface ExtendableOptions {
  // ...
  staticCss?: ExtendableStaticCssOptions  // ← References private interface
  // ...
}

// Line 447: Main config type
export interface Config extends ExtendableOptions { ... }
```

**The Critical Problem:**
- `ExtendableStaticCssOptions` is **NOT exported** from the module
- It's a private interface only used internally
- The declaration bundler cannot inline it (it's an interface with extends)
- The bundler must emit a module reference to where it's defined
- That module path is non-portable (`.pnpm`)

## Which APIs Are Affected

### ✅ APIs That Work (No Workaround Needed)

**Pattern:** Use types from `Config['theme']` or simple top-level Config properties

| API | Type Path | Why It Works |
|-----|-----------|--------------|
| `tokens` | `Config['theme']['tokens']` | Simple token definition type |
| `keyframes` | `Config['theme']['keyframes']` | Simple keyframe definition type |
| `globalCss` | `Config['globalCss']` | After dependency fix, type is "simple enough" |
| `globalFontface` | `Config['globalFontface']` | After dependency fix, type is "simple enough" |

**Example (tokens.ts - clean, works fine):**
```ts
type TokenConfig = NonNullable<Config['theme']>['tokens']

export const tokensCollector = createFragmentCollector<TokenConfig, PandaConfig>({
  name: 'tokens',
  targetFunction: 'tokens',
  transform: tokenConfig => ({ theme: { tokens: tokenConfig } }),
})

export const tokens = tokensCollector.collect  // ✅ No casting needed
```

### ⚠️ APIs That Need Workarounds

**Pattern:** Use types that reference complex internal Panda interfaces

| API | Type Path | Problem Type |
|-----|-----------|--------------|
| `staticCss` | `Config['staticCss']` | → `ExtendableStaticCssOptions` (private) |
| `utilities` | `Config['utilities']['extend']` | → `UtilityConfig` (complex nested) |

**Example (staticCss.ts - requires casting):**
```ts
type StaticCssConfig = NonNullable<Config['staticCss']>

// Create with proper internal types
const collector = createFragmentCollector<StaticCssConfig, PandaConfig>({
  name: 'staticCss',
  targetFunction: 'staticCss',
  transform: config => ({ staticCss: config }),
})

// Cast exports to portable types for declaration bundler
export const staticCssCollector = collector as FragmentCollector<
  Record<string, unknown>,
  Record<string, unknown>
>

export const staticCss = collector.collect as (config: Record<string, unknown>) => void
```

## The Workaround Explained

### What We Do

1. **Internally:** Create collector with full Panda types (type-safe development)
2. **Exports:** Cast to `Record<string, unknown>` (portable declarations)

### Why It Works

- `Record<string, unknown>` is a built-in TypeScript type
- No external module references needed
- Declaration bundler can emit it inline
- Consumers get a working (though generic) type

### Trade-offs

**✅ Pros:**
- Declarations build successfully  
- Internal code keeps full type safety
- Consumers can use the APIs (runtime works perfectly)
- Passes all 55 tests

**❌ Cons:**
- Consumers lose IntelliSense for `staticCss` and `utilities`
- Type parameter is generic `Record<string, unknown>`
- Must rely on JSDoc examples and documentation

## Solution Summary

**Fixed by moving dependencies:**
```json
{
  "dependencies": {
    "@pandacss/dev": "^1.8.1",
    "@pandacss/types": "^1.8.2"
  }
}
```

**Applied type workarounds to:**
- `src/system/api/utilities.ts`
- `src/system/api/staticCss.ts`

**No workarounds needed for:**
- `src/system/api/tokens.ts`
- `src/system/api/keyframes.ts`
- `src/system/api/globalCss.ts`
- `src/system/api/globalFontface.ts`

## Related Documentation

- Full issue analysis: `./ISSUE.md`
- Declaration compilation: `../packager/ts/compile/index.ts`
- Entry point: `../entry/system.ts`
