# Patterns Migration Plan

**Status**: ✅ **COMPLETED** - Successfully implemented in reference-cli

**Goal**: Port pattern-based styling props from `@reference-ui/core` to `@reference-ui/cli`, leveraging the new fragment-based architecture.

---

## Implementation Summary

✅ **Completed Implementation** (All phases done)

Successfully migrated pattern props (font, container, r) from reference-core to reference-cli with major architectural improvements:

### What Was Delivered

1. **Pattern Fragment API** (`src/system/api/patterns.ts`)
   - `extendPattern()` function using fragment collector
   - Type-safe `BoxPatternExtension` interface
   - Properly typed (no `any` types)

2. **Internal Pattern Props** (`src/system/internal/props/`)
   - `font.ts` - Font family presets + weight tokens
   - `container.ts` - Container query setup
   - `r.ts` - Responsive container queries

3. **Build System** (`src/build/boxPattern.ts`)
   - Scans pattern fragments at build time
   - Generates `internal/box.mjs` (JavaScript output, not TypeScript)
   - Inlines transform functions for Panda compatibility

4. **Updated Primitives**
   - `Div` component uses box pattern with custom props
   - Full TypeScript type support

5. **Comprehensive Tests**
   - 9 box pattern generation tests ✅
   - 10 custom props integration tests ✅
   - All 24 tests passing ✅

### Key Architectural Decisions

- **Generate `.mjs` not `.ts`** - Output is JavaScript since it's only bundled into internal-fragments.mjs
- **Build-time only** - No runtime scanning/evaluation
- **Fragment system** - Consistent with existing architecture
- **Type-safe source** - Props files are TypeScript, generated output is JavaScript
- **No ESLint errors** - Clean implementation

### Files Created

- `src/system/api/patterns.ts` (40 lines)
- `src/build/boxPattern.ts` (137 lines)
- `src/system/internal/props/{font,container,r,index}.ts`
- `tests/system/boxPattern.test.ts`
- `tests/primitives/customProps.test.tsx`
- `src/system/internal/box.mjs` (generated, gitignored)

---

## Related Systems

**Font System** - See `fonts.md` for comprehensive font definition system (next priority)
- Current patterns include hardcoded font props
- Font system will generate these automatically from user `font()` definitions
- Will replace hardcoded font pattern with generated version

---

## Original Plan

Below is the original implementation plan for reference:

---

## Overview

In `reference-core`, we had custom pattern extensions (box, font, container, r) that were collected at runtime and generated into `src/styled/props/box.ts`. This required runtime scanning and evaluation during CLI execution.

In `reference-cli`, we've improved the architecture:

1. **Fragment system** - All config extensions use fragments that are collected and bundled at build time
2. **Internal system** - `src/system/internal/` contains the design system spec that gets injected into Panda
3. **Simpler API** - One global `extendPandaConfig` that merges config partials

However, **box pattern extensions are special** - they need to be collected and inlined into a single generated file because:

- Multiple props (font, weight, container, r) extend the same `box` pattern
- Each extension contributes properties + transform logic
- Transforms must be inlined (no closures) so Panda codegen emits valid `box.js`

---

## Current State

### reference-core (prototype)

**Pattern prop files:**
- `src/styled/props/font.ts` - font + weight props
- `src/styled/props/container.ts` - container prop  
- `src/styled/props/r.ts` - responsive container queries

**Each prop file:**
```ts
import { extendPattern } from '../api'

extendPattern({
  properties: { font: { type: 'string' } },
  transform(props) { /* ... */ }
})
```

**Build process:**
1. `extendPattern` → `extendBoxPattern` (pushes to globalThis array)
2. CLI runtime scans for `extendPattern` calls
3. Evaluates files to collect extensions
4. Generates `src/styled/props/box.ts` with inlined transforms
5. Generated box.ts calls `extendPandaConfig({ patterns: { extend: { box: {...} } } })`

**Problems:**
- Runtime scanning/eval during CLI execution (slow)
- Complex collector lifecycle management
- Tight coupling between CLI runtime and pattern generation

### reference-cli (current)

**What we have:**
- `src/system/api/extendPandaConfig.ts` - Fragment-based config extension
- `src/lib/fragments/` - Collector, scanner, bundler for fragments
- `src/build/styled.ts` - Internal styled build (prebuild)
- `src/system/internal/tokens.ts` - Example internal fragment

**What we need:**
- Port pattern props (font, container, r) to `src/system/internal/`
- Build-time pattern collection (not runtime)
- Generate box pattern before `build/styled.ts` runs

---

## Proposed Architecture

### 1. Pattern Fragment API

Create a new fragment type for pattern extensions that works with the existing fragment system:

**Location:** `src/system/api/patterns.ts`

```ts
import { createFragmentFunction } from '../../lib/fragments/collector'

export interface BoxPatternExtension {
  properties: Record<string, { type: string }>
  transform: (props: Record<string, any>) => Record<string, any>
}

// Create collector for box pattern fragments
const { fn, collector } = createFragmentFunction<BoxPatternExtension>({
  name: 'box-pattern',
  targetFunction: 'extendPattern',
  globalKey: '__refBoxPatternCollector'
})

export const extendPattern = fn
export function createBoxPatternCollector() {
  return collector
}
```

### 2. Internal Pattern Props

Port prop definitions to `src/system/internal/props/`:

```
src/system/internal/props/
├── font.ts       # font + weight props
├── container.ts  # container prop
├── r.ts          # responsive prop
└── index.ts      # re-exports
```

**Example - `internal/props/font.ts`:**
```ts
import { extendPattern } from '../../api/patterns'

extendPattern({
  properties: {
    font: { type: 'string' },
    weight: { type: 'string' }
  },
  transform(props) {
    const { font, weight } = props
    // ... transform logic (same as reference-core)
    return result
  }
})
```

### 3. Build-Time Pattern Generation

Create `src/build/boxPattern.ts` that runs **before** `build/styled.ts`:

```ts
#!/usr/bin/env node
/**
 * Build script for box pattern generation.
 * 
 * Collects pattern fragments from internal/props/ and generates
 * the box pattern file that extends Panda config.
 */

import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFileSync, mkdirSync } from 'node:fs'
import { scanForFragments, collectFragments } from '../lib/fragments'
import { createBoxPatternCollector } from '../system/api/patterns'

const __filename = fileURLToPath(import.meta.url)
const CLI_ROOT = resolve(dirname(__filename), '../..')
const BOX_PATTERN_OUTPUT = join(CLI_ROOT, 'src/system/internal/box.ts')

async function buildBoxPattern(): Promise<void> {
  console.log('[build:box] Scanning for pattern fragments...')
  
  const patternCollector = createBoxPatternCollector()
  
  // Scan for extendPattern calls in internal/props/
  const fragmentFiles = scanForFragments({
    include: ['src/system/internal/props/**/*.ts'],
    functionNames: ['extendPattern'],
    exclude: ['**/*.d.ts', '**/index.ts'],
    cwd: CLI_ROOT
  })
  
  console.log(`[build:box] Found ${fragmentFiles.length} pattern files`)
  
  if (fragmentFiles.length === 0) {
    console.log('[build:box] No patterns found, skipping')
    return
  }
  
  // Collect extensions
  const tempDir = join(CLI_ROOT, 'src/system/internal/.tmp')
  const extensions = await collectFragments({
    files: fragmentFiles,
    collector: patternCollector,
    tempDir
  })
  
  console.log(`[build:box] Collected ${extensions.length} extensions`)
  
  // Generate box.ts with inlined transforms
  const content = generateBoxPattern(extensions)
  
  mkdirSync(dirname(BOX_PATTERN_OUTPUT), { recursive: true })
  writeFileSync(BOX_PATTERN_OUTPUT, content, 'utf-8')
  
  console.log(`[build:box] ✓ Generated ${BOX_PATTERN_OUTPUT}`)
}

function generateBoxPattern(extensions: BoxPatternExtension[]): string {
  // Merge all properties
  const properties: Record<string, any> = {}
  for (const ext of extensions) {
    Object.assign(properties, ext.properties)
  }
  
  const blocklist = Object.keys(properties)
  const blocklistStr = JSON.stringify(blocklist)
  
  // Inline each transform as an IIFE
  const transformIIFEs = extensions.map((ext, i) => {
    const fnBody = ext.transform.toString()
      .replace(/^function[^{]*{/, '')  // Remove function header
      .replace(/}$/, '')                // Remove closing brace
      .trim()
      .split('\n')
      .map(line => '    ' + line)      // Indent for readability
      .join('\n')
    
    return [
      `const _r${i} = (function(props: Record<string, any>) {`,
      fnBody,
      `})(props)`
    ].join('\n')
  })
  
  const resultVars = extensions.map((_, i) => `_r${i}`)
  
  // Generate file content
  return `/** Generated by build/boxPattern.ts - do not edit manually */

import { extendPandaConfig } from '../api/extendPandaConfig'

extendPandaConfig({
  patterns: {
    extend: {
      box: {
        properties: {
${Object.entries(properties).map(([k, v]) => `          ${k}: ${JSON.stringify(v)} as const`).join(',\n')}
        },
        blocklist: ${blocklistStr},
        transform(props: Record<string, any>) {
          const blocklist = ${blocklistStr}
          const extensionKeys = new Set(blocklist)
          const rest = Object.fromEntries(
            Object.entries(props).filter(([k]) => !extensionKeys.has(k))
          )
          
${transformIIFEs.map(iife => '          ' + iife.replace(/\n/g, '\n          ')).join('\n')}
          
          return Object.assign({}, ${resultVars.join(', ')}, rest)
        }
      }
    }
  }
})
`
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  await buildBoxPattern()
}
```

### 4. Generated Output

**Location:** `src/system/internal/box.ts` (gitignored, generated)

This file will be generated by `build/boxPattern.ts` and will contain:

```ts
/** Generated by build/boxPattern.ts - do not edit manually */

import { extendPandaConfig } from '../api/extendPandaConfig'

extendPandaConfig({
  patterns: {
    extend: {
      box: {
        properties: {
          font: { type: 'string' } as const,
          weight: { type: 'string' } as const,
          container: { type: 'string' } as const,
          r: { type: 'object' } as const
        },
        blocklist: ['font', 'weight', 'container', 'r'],
        transform(props: Record<string, any>) {
          const blocklist = ['font', 'weight', 'container', 'r']
          const extensionKeys = new Set(blocklist)
          const rest = Object.fromEntries(
            Object.entries(props).filter(([k]) => !extensionKeys.has(k))
          )
          
          const _r0 = (function(props: Record<string, any>) {
            const { font, weight } = props
            // ... font transform logic
            return result
          })(props)
          
          const _r1 = (function(props: Record<string, any>) {
            const { container } = props
            // ... container transform logic
            return result
          })(props)
          
          const _r2 = (function(props: Record<string, any>) {
            const { r, container } = props
            // ... responsive transform logic
            return result
          })(props)
          
          return Object.assign({}, _r0, _r1, _r2, rest)
        }
      }
    }
  }
})
```

### 5. Build Pipeline Integration

Update `package.json` scripts:

```json
{
  "scripts": {
    "prebuild": "tsx src/build/boxPattern.ts && tsx src/build/styled.ts",
    "build": "pnpm run build:native && tsup"
  }
}
```

**Build sequence:**
1. `build/boxPattern.ts` - Collect pattern fragments → generate `internal/box.ts`
2. `build/styled.ts` - Scan internal/ (including box.ts) → bundle fragments → generate panda.config → run Panda
3. `tsup` - Bundle CLI to dist/

### 6. Internal Fragments Filter

Update `build/styled.ts` to include the generated box pattern:

```ts
// In build/styled.ts
const internalFragmentFiles = fragmentFiles.filter(f => 
  f.includes('/system/internal/')
)

// This will now include:
// - src/system/internal/tokens.ts (existing)
// - src/system/internal/box.ts (generated)
// - src/system/internal/props/**/*.ts (new pattern fragments)
```

---

## Migration Checklist

### Phase 1: API Setup
- [ ] Create `src/system/api/patterns.ts` with `extendPattern` and collector
- [ ] Add pattern types (`BoxPatternExtension`)
- [ ] Export from `src/system/api/index.ts`

### Phase 2: Internal Props
- [ ] Create `src/system/internal/props/` directory
- [ ] Port `font.ts` from reference-core
- [ ] Port `container.ts` from reference-core
- [ ] Port `r.ts` from reference-core
- [ ] Create `props/index.ts` with re-exports
- [ ] Update `src/system/internal/index.ts` to export props

### Phase 3: Build Script
- [ ] Create `src/build/boxPattern.ts` with:
  - Fragment scanning for `extendPattern`
  - Collection using box pattern collector
  - Generation logic (inline transforms)
  - File writing to `internal/box.ts`
- [ ] Add `internal/box.ts` to `.gitignore`
- [ ] Update `package.json` prebuild script

### Phase 4: Styled Build Integration
- [ ] Update `build/styled.ts` to include generated box.ts in internal fragments
- [ ] Test build sequence: boxPattern → styled → tsup

### Phase 5: Testing
- [ ] Test pattern fragments are collected correctly
- [ ] Verify box.ts is generated with all extensions
- [ ] Verify internal fragments bundle includes box pattern
- [ ] Test full build pipeline
- [ ] Verify Panda output includes box pattern extensions

### Phase 6: Documentation
- [ ] Document `extendPattern` API in system/api
- [ ] Update internal/README.md with pattern info
- [ ] Add examples to patterns.md

---

## Differences from reference-core

| Aspect | reference-core | reference-cli |
|--------|---------------|---------------|
| **Collection timing** | CLI runtime | Build time |
| **Scanner** | Runtime glob + eval | Fragment scanner |
| **Collector** | Custom globalThis | Fragment collector |
| **Generation** | During CLI execution | During prebuild |
| **Output location** | `src/styled/props/box.ts` | `src/system/internal/box.ts` |
| **API** | `extendPattern` → `extendBoxPattern` | `extendPattern` → fragment collector |
| **Integration** | Runtime config merge | Build-time fragment bundle |

---

## Benefits of New Architecture

1. **Build-time only** - Pattern collection happens during CLI build, not userspace sync
2. **Faster** - No runtime scanning/eval; patterns are pre-bundled
3. **Cleaner separation** - Internal extensions live in `internal/`, not scattered
4. **Fragment consistency** - Patterns use same fragment system as tokens, recipes, etc.
5. **Simpler lifecycle** - No complex runtime collector management
6. **Better DX** - Clear build sequence, generated files gitignored
7. **Type safety** - Fragment types ensure correct pattern structure

---

## Font System Migration

The font system in reference-core has two parts:

1. **Font definitions** - Collected from user code (font name, weights, @font-face rules)
2. **Font pattern** - Generated extension to box pattern with font + weight props

### Strategy

For reference-cli, we can simplify:

1. **Built-in fonts** - Define default fonts in `internal/fonts/` as fragments:
   - `tokens({ fonts: {...}, fontWeights: {...} })`
   - `globalFontface({ Inter: {...}, Literata: {...} })`

2. **Font pattern** - The pattern extension goes in `internal/props/font.ts` (already planned)

3. **User fonts** - Users can extend via fragments in their codebase:
   ```ts
   // In user app
   tokens({ fonts: { custom: { value: '...' } } })
   globalFontface({ CustomFont: {...} })
   ```

**No need for font collector** - Fonts are just tokens + fontface rules, which already work via fragments.

---

## Rhythm Utilities

reference-core has rhythm utilities (e.g., `4r` → `calc(4 * var(--spacing-r))`).

### Strategy

Port to `src/system/internal/rhythm/`:

```
src/system/internal/rhythm/
├── utilities.ts  # rhythm utilities (r1, r2, etc.)
├── helpers.ts    # getRhythm(), resolveRhythm()
└── index.ts
```

**Example - `rhythm/utilities.ts`:**
```ts
import { utilities } from '../../api/utilities'

utilities({
  r: {
    values: 'spacing',
    transform(value) {
      return { 
        margin: `calc(${value} * var(--spacing-r))` 
      }
    }
  }
})
```

This uses the existing `utilities()` API - no special handling needed.

---

## Layer Prop

reference-core has a `layer` prop for scoping to design system layers.

### Strategy

Add to `internal/props/layer.ts`:

```ts
import { extendPattern } from '../../api/patterns'

extendPattern({
  properties: {
    layer: { type: 'string' }
  },
  transform(props) {
    const { layer } = props
    if (!layer) return {}
    return {
      '&[data-layer]': {
        // Layer-specific styles
      }
    }
  }
})
```

---

## File Structure (Final)

```
src/
├── build/
│   ├── boxPattern.ts        # NEW: Generate box pattern from fragments
│   └── styled.ts            # EXISTING: Generate internal styled
├── system/
│   ├── api/
│   │   ├── patterns.ts      # NEW: extendPattern + collector
│   │   ├── utilities.ts     # EXISTING: utilities API
│   │   ├── tokens.ts        # EXISTING: tokens API
│   │   ├── globalCss.ts
│   │   ├── globalFontface.ts
│   │   ├── keyframes.ts
│   │   ├── staticCss.ts
│   │   └── extendPandaConfig.ts
│   ├── internal/
│   │   ├── box.ts           # GENERATED: Combined box pattern
│   │   ├── tokens.ts        # EXISTING: Default tokens
│   │   ├── props/           # NEW: Pattern prop fragments
│   │   │   ├── font.ts
│   │   │   ├── container.ts
│   │   │   ├── r.ts
│   │   │   ├── layer.ts
│   │   │   └── index.ts
│   │   ├── rhythm/          # NEW: Rhythm utilities
│   │   │   ├── utilities.ts
│   │   │   ├── helpers.ts
│   │   │   └── index.ts
│   │   ├── fonts/           # NEW: Built-in font definitions
│   │   │   ├── inter.ts
│   │   │   ├── literata.ts
│   │   │   ├── jetbrains-mono.ts
│   │   │   └── index.ts
│   │   ├── index.ts
│   │   └── README.md
│   └── styled/              # GENERATED: Panda output
```

---

## Next Steps

1. Start with Phase 1 (API setup)
2. Implement Phase 2 (port one prop as POC, e.g., container.ts)
3. Build Phase 3 (boxPattern build script)
4. Test end-to-end with one prop
5. Complete Phase 2 (port remaining props)
6. Add rhythm utilities
7. Add built-in fonts
8. Full integration testing

---

## Open Questions

1. **JSX names** - reference-core includes `PRIMITIVE_JSX_NAMES` in box pattern. Do we need this in CLI?
   - **Answer**: Yes, but it should come from a constant file, not hardcoded.

2. **Pattern dependencies** - Some props depend on others (e.g., `r` uses `container`). Order matters?
   - **Answer**: Transform order is preserved by fragment file order. Document dependency in props.

3. **User-defined patterns** - Should users be able to extend box pattern?
   - **Answer**: Not initially. Focus on internal system first. Can add later via fragments.

4. **Performance** - Build time impact of pattern generation?
   - **Answer**: Minimal - pattern collection is fast, runs once during prebuild.

---

## References

- [reference-core box pattern](../../reference-core/src/cli/system/config/boxPattern/)
- [reference-cli fragments](../lib/fragments/)
- [reference-cli architecture](../ARCHITECTURE.md)

---

## Refactor: Patterns as a Separate Submodule

**Goal**: Isolate pattern complexity so the config module stays untouched. Patterns become their own subsystem that eventually outputs to the right fragment streams.

### The Problem

Patterns (box extensions) have special needs:
- Multiple sources: system (container, r) + user (font, custom extendPattern)
- Must be merged into one box config before reaching Panda
- Font pattern is generated at ref sync from `font()` definitions
- Running/eval complexity was leaking into `createPandaConfig`

### The Approach: Patterns Submodule

**Patterns run as a separate module within system.** They own:
- Their own Liquid templates (for extending the box pattern only)
- Collection of system pattern fragments (container, r, etc.)
- Collection of user pattern fragments (from `font()`, direct `extendPattern` calls)
- Merging logic
- Output that fits into the existing fragment streams

**On that layer, we differentiate:**
- **System pattern fragments** — internal (container, r) + font pattern (generated from `font()`)
- **User pattern fragments** — user code that calls `extendPattern` directly

### End State

Eventually:
- **System patterns** → turn into system fragments (injected into `internalFragments`)
- **User patterns** → injected into `userFragments`

**In theory, we don't have to touch the config module at all.** The pattern module produces output that is just another fragment bundle. Config receives `internalFragments` and `userFragments` as it does today — it doesn't need to know that some of that content came from the pattern pipeline.

### Structure (Proposed)

```
src/system/
├── patterns/                    # Patterns submodule (new)
│   ├── index.ts                 # Public API: runPatternPipeline(), etc.
│   ├── collect.ts               # Collect system + user pattern fragments
│   ├── merge.ts                 # Merge extensions into one box config
│   ├── liquid/                  # Pattern-specific Liquid templates
│   │   ├── box-pattern.liquid    # Renders merged box pattern as extendPandaConfig
│   │   └── font-pattern.liquid   # Font/weight props (from font() definitions)
│   ├── system/                  # System pattern sources
│   │   ├── container.ts
│   │   └── r.ts
│   └── ...
├── config/                      # Stays clean — just receives fragments
│   ├── createPandaConfig.ts     # No pattern logic
│   └── ...
└── ...
```

### Flow

1. **Pattern module** runs (during ref sync or build):
   - Collects system patterns (container, r)
   - Collects user patterns (font from `font()`, any direct `extendPattern`)
   - Merges via Liquid templates
   - Outputs: `systemPatternFragments` string, `userPatternFragments` string

2. **Fragment assembly** (whoever calls createPandaConfig):
   - `internalFragments` = tokens + ... + `systemPatternFragments`
   - `userFragments` = ... + `userPatternFragments`

3. **Config module**:
   - Receives `internalFragments` and `userFragments`
   - Renders panda template
   - No pattern-specific logic

### Benefits

- Config module stays dumb — no pattern pipeline, no eval, no merge logic
- Pattern complexity is isolated and testable
- Clear boundary: patterns submodule owns "how box gets extended"
- Liquid templates live where they're used (patterns), not in config
