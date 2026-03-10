# Fragment Collection API Design

## What Are Fragments?

**Fragments** are plain JavaScript objects that users define to extend configuration:

```ts
// A token fragment
tokens({
  colors: {
    primary: { value: '#3B82F6' }
  }
})

// A recipe fragment
recipe({
  className: 'button',
  base: { padding: '8px' }
})
```

The CLI scans user code for these function calls, collects the objects, and merges them into final configuration (like `panda.config.ts`).

## Simple Usage Pattern

### 1. Create Collectors

```ts
// CLI creates collectors (they ARE the functions + metadata)
export const tokens = createFragmentCollector({
  name: 'tokens',
  targetFunction: 'tokens',
})

export const recipe = createFragmentCollector({
  name: 'recipe',
  targetFunction: 'recipe',
})
```

### 2. Library Exports Functions

```ts
// @reference-ui/system - just re-export!
export { tokens, recipe } from '@reference-ui/core/collectors'
```

### 3. Users Call Functions

```ts
// User code - clean and simple
import { tokens, recipe } from '@reference-ui/system'

tokens({
  colors: {
    primary: { value: '#3B82F6' }
  }
})

recipe({
  className: 'button',
  base: { padding: '8px' }
})
```

### 4. CLI Collects All Fragments

```ts
// CLI reads user config
const config = loadUserConfig() // ui.config.ts

// CLI runs collection using config.include patterns
const allFragments = await collectFragments({
  collectors: [tokens, recipe],
  include: config.include,  // ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}']
})

// Returns: { tokens: [...], recipe: [...] }
```

**Note:** `collectFragments` accepts glob patterns directly (via `fast-glob`), not directory paths. This matches how `config.include` works in `ui.config.ts`.

---

## Implementation Notes

### What is a Fragment?

A **fragment** is a **runtime JavaScript object** - plain data:

```ts
// Fragment examples
{ colors: { primary: { value: '#3B82F6' } } }
{ className: 'button', base: { padding: '8px' } }
```

### Implementation: Callable Collector

`createFragmentCollector` returns a **function with properties**:

```ts
// Returns a callable function
const tokens = createFragmentCollector({ name: 'tokens', ... })

// Users call it
tokens({ colors: { ... } })

// CLI accesses metadata
tokens.config.targetFunction  // 'tokens'
tokens.init()
tokens.getFragments()
tokens.cleanup()
```

This is implemented via `Object.assign` to attach properties to the function.

### Fragments Live in User Code

Fragments are defined in **user code** (not build config):

```ts
// ui.config.ts - tells CLI where to scan
export default defineConfig({
  include: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}']
})

// src/components/Button.tsx - user defines fragments
import { tokens } from '@reference-ui/system'

tokens({ colors: { primary: { value: '#3B82F6' } } })
```

The CLI scans `config.include` patterns (via `fast-glob`) to find and collect fragments. This makes the build-time/runtime boundary nearly invisible - fragments feel like runtime code but are collected at build time.

### Fragments vs Microbundle

**Fragments** = data that users define  
**Microbundle** = execution engine that runs user code

### How reference-core Uses Microbundle

Looking at `createPandaConfig`, `createBoxPattern`, and `createBaseSystem`:

```ts
// 1. Scan for files calling extendPandaConfig()
const configFiles = scanDirectories(['src/system/styled', ...userDirs])

// 2. Create entry importing ALL fragment files
const entryContent = buildPandaEntryContent({
  configFilePaths: configFiles,
})

// 3. Microbundle ENTIRE entry once
const bundled = await microBundle(entryPath)

// 4. Bundled code IS the final config
writeFileSync('panda.config.ts', bundled)
```

**Key:** Microbundle runs **once** on all fragments together, not individually.

### Two Patterns

1. **Direct merge** (panda config):
   - Bundle all fragments → Final config file

2. **Collect then generate** (box pattern):
   - Bundle collect script → Run → JSON → Generate code

Fragments system should support both approaches.

---

## Context for Implementation

### What We Learned from reference-core

**Current fragment collection pattern:**
1. `extendPandaConfig()` / `extendBoxPattern()` use global collector arrays
2. `scanDirectories()` finds files calling these functions
3. `buildEntryContent()` creates entry importing all fragment files
4. `microBundle()` bundles the entire entry once
5. For panda config: bundled code IS the final output
6. For box pattern: bundle → run → JSON → generate code

**Key files to reference:**
- `reference-core/src/cli/system/config/panda/createPandaConfig.ts` - direct merge pattern
- `reference-core/src/cli/system/config/boxPattern/createBoxPattern.ts` - collect-then-generate pattern
- `reference-core/src/cli/system/config/panda/extendPandaConfig.ts` - collector function example
- `reference-core/src/cli/system/config/panda/initCollector.ts` - init pattern
- `reference-core/src/cli/system/collectors/runCollectScript.ts` - execution flow

### Implementation Checklist

#### 1. Update `createFragmentCollector` API

Current implementation returns object with separate properties:
```ts
return { config, collect, init, cleanup, getFragments }
```

Need to return **callable function with properties**:
```ts
const collect = (fragment: T) => { ... }
Object.assign(collect, { config, init, cleanup, getFragments })
return collect as CollectorFunction<T>
```

**Type definition:**
```ts
interface CollectorFunction<T> {
  (fragment: T): void
  config: FragmentCollectorConfig
  init: () => void
  cleanup: () => void
  getFragments: () => T[]
}
```

#### 2. Update `collectFragments` API

**Current:** Takes `{ files, collector, tempDir }`
**New:** Takes `{ collectors: CollectorFunction[], include: string[], tempDir? }`

**Key changes:**
- Accept **array of collectors** (not single)
- Accept **glob patterns** via `include` (not directories)
- Use `fast-glob` to resolve patterns to files
- Extract all `targetFunction` names from collectors
- Scan once for all functions
- Initialize all collectors before bundling
- Return object keyed by collector name: `{ tokens: [...], recipe: [...] }`

#### 3. Update `scanForFragments` API

**Current:** Takes `{ directories, functionNames, include?, exclude? }`

**Option A - Keep compatible:** Add support for glob patterns as directories
```ts
// If pattern starts with **, treat as glob, else as directory
const isGlob = dir.includes('*')
```

**Option B - Separate APIs:**
```ts
scanForFragments({ directories, functionNames }) // legacy
scanForFragmentsGlob({ patterns, functionNames }) // new
```

**Recommendation:** Option A for backward compatibility

#### 4. Test Fixtures Need Update

Current fixtures have inline collector implementation. Need to:

1. Create `tests/fixtures/setup.ts`:
   ```ts
   export const myFunction = createFragmentCollector({
     name: 'myFunction',
     targetFunction: 'myFunction',
   })
   ```

2. Update `tests/fixtures/use-function.ts`:
   ```ts
   import { myFunction } from './setup'
   myFunction({ name: 'simple', value: 42 })
   ```

3. Update tests to use new API:
   ```ts
   const allFragments = await collectFragments({
     collectors: [myFunction],
     include: ['**/*.ts'],
   })
   expect(allFragments.myFunction).toHaveLength(2)
   ```

### Testing Strategy

#### Unit Tests
- ✅ `createFragmentCollector` returns callable function with properties
- ✅ Collector function pushes to globalThis array
- ✅ Multiple collectors use different global keys
- ✅ `init/cleanup/getFragments` work correctly

#### Integration Tests  
- ✅ `collectFragments` accepts glob patterns via `include`
- ✅ Scans once for multiple collectors
- ✅ Returns keyed object `{ collectorName: [...] }`
- ✅ Handles TypeScript imports correctly
- ✅ Isolates fragments between collectors

#### E2E Tests
- ✅ Full workflow: create → export → call → collect
- ✅ Works with `config.include` patterns from `ui.config.ts`
- ✅ Multiple collectors in single pass
- ✅ Nested imports resolve correctly

### Migration Path

**Phase 1: Update types and factory**
1. Change `createFragmentCollector` return type
2. Use `Object.assign` to attach properties to function
3. Update type exports

**Phase 2: Update collectFragments**
1. Accept array of collectors
2. Accept `include` patterns instead of `directories`
3. Extract `targetFunction` from each collector
4. Return keyed object

**Phase 3: Update tests**
1. Fix test fixtures to use new pattern
2. Update test assertions for keyed results
3. Add tests for glob pattern support

**Phase 4: Update documentation**
1. Update README with new API
2. Add examples showing `config.include` usage
3. Document callable function pattern

### Gotchas & Considerations

1. **Glob pattern resolution**
   - `fast-glob` uses `cwd` option - need to handle relative vs absolute paths
   - Current scanner uses directories as `cwd` - need to adapt

2. **Collector name conflicts**
   - If two collectors have same name, result object will overwrite
   - Consider validation or namespacing

3. **globalKey generation**
   - Current: `__ref${capitalize(name)}Collector`
   - Ensure no collisions between different collector instances

4. **TypeScript types**
   - Callable function with properties is tricky to type
   - Need intersection type: `CollectorFn & { config, init, ... }`

5. **Backward compatibility**
   - Existing code in reference-core uses old pattern
   - May need adapter or gradual migration

6. **Test isolation**
   - Each test must cleanup globalThis
   - Use unique global keys per test to avoid collisions

### Integration with reference-core

Eventually, this should replace:
- `extendPandaConfig` → use `createFragmentCollector`
- `extendBoxPattern` → use `createFragmentCollector`
- Custom scanner → use `collectFragments`
- Manual entry building → use `collectFragments` with entry template

**Benefits:**
- ✅ Consistent API across all fragment types
- ✅ Type-safe collector creation
- ✅ Reusable scanning/collection logic
- ✅ Less boilerplate

